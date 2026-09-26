import { ConvexClient } from "convex/browser";
import fs from "fs";
import path from "path";

// 1. Configuration Settings
const NETLIFY_DOMAIN = "https://scratchcardtrial.netlify.app";
const CONVEX_URL = "https://qualified-malamute-752.convex.cloud"; // Your Convex Deployment URL

// 2. Hub-Specific Payout Construct Templates
const HUB_TEMPLATES = {
  KOR: {
    theme: "maroon_gold",
    title: "KORAMANGALA SURGE",
    eventDates: "Oct 7 & 8",
    shift: "WEEKEND SPECIAL",
    earnings: "₹1,200",
    perOrderBonus: "₹40",
    continuationBonus: "₹1,500",
    rewardCode: "KOR-OCT-24",
  },
  WHT: {
    theme: "maroon_gold",
    title: "WHITEFIELD MEGA SURGE",
    eventDates: "Oct 7 & 8",
    shift: "PEAK SHIFT BOOST",
    earnings: "₹1,500",
    perOrderBonus: "₹50",
    continuationBonus: "₹2,000",
    rewardCode: "WHT-OCT-24",
  },
  IND: {
    theme: "maroon_gold",
    title: "INDIRANAGAR BOOST",
    eventDates: "Oct 7 & 8",
    shift: "FLEXI HOURS",
    earnings: "₹1,000",
    perOrderBonus: "₹30",
    continuationBonus: "₹1,200",
    rewardCode: "IND-OCT-24",
  },
  // Fallback for unknown hub codes
  DEFAULT: {
    theme: "maroon_gold",
    title: "CITY REENGAGEMENT BOOST",
    eventDates: "Oct 7 & 8",
    shift: "STANDARD SHIFT",
    earnings: "₹1,100",
    perOrderBonus: "₹35",
    continuationBonus: "₹1,200",
    rewardCode: "GEN-OCT-24",
  },
};

const client = new ConvexClient(CONVEX_URL);

async function processBulkCampaign() {
  console.log("🚀 Reading riders.csv...");
  
  const csvPath = path.resolve("./riders.csv");
  if (!fs.existsSync(csvPath)) {
    console.error("❌ Error: riders.csv file not found in root directory.");
    process.exit(1);
  }

  const rawData = fs.readFileSync(csvPath, "utf-8");
  const lines = rawData.split("\n").filter((line) => line.trim() !== "");
  
  // Skip CSV Header
  const rows = lines.slice(1);
  const itemsToProcess = [];

  for (const row of rows) {
    const [riderId, hubCode, city] = row.split(",").map((s) => s?.trim());
    if (!riderId || !hubCode) continue;

    // Pick Hub Construct or fallback to Default
    const template = HUB_TEMPLATES[hubCode] || HUB_TEMPLATES.DEFAULT;

    itemsToProcess.push({
      recipientIdentifier: riderId,
      hubCode: hubCode,
      city: city || "Bangalore",
      payload: template,
    });
  }

  console.log(`📦 Processed ${itemsToProcess.length} riders from CSV. Ingesting into Convex...`);

  // Batch process in chunks of 100 records to prevent payload timeouts
  const CHUNK_SIZE = 100;
  const allResults = [];

  for (let i = 0; i < itemsToProcess.length; i += CHUNK_SIZE) {
    const chunk = itemsToProcess.slice(i, i + CHUNK_SIZE);
    
    // Call Convex batch mutation directly
    const results = await client.mutation("cards:batchGenerateCards", { items: chunk });
    allResults.push(...results);
    console.log(`✅ Chunk ${Math.floor(i / CHUNK_SIZE) + 1} synced (${allResults.length}/${itemsToProcess.length})`);
  }

  // 3. Export to campaign_sms_links.csv
  let outputCsv = "rider_id,hub_code,city,access_key,sms_tracking_link\n";

  for (let i = 0; i < itemsToProcess.length; i++) {
    const item = itemsToProcess[i];
    const match = allResults.find((r) => r.riderId === item.recipientIdentifier);
    const accessKey = match ? match.accessKey : "ERROR";
    const trackingLink = `${NETLIFY_DOMAIN}/?id=${accessKey}`;

    outputCsv += `${item.recipientIdentifier},${item.hubCode},${item.city},${accessKey},${trackingLink}\n`;
  }

  fs.writeFileSync("./campaign_sms_links.csv", outputCsv);
  console.log("\n🎉 SUCCESS! Generated 'campaign_sms_links.csv' ready for SMS dispatch.");
  process.exit(0);
}

processBulkCampaign().catch((err) => {
  console.error("❌ Bulk Process Failed:", err);
  process.exit(1);
});