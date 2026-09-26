import { mutation } from "./_generated/server";
import { v } from "convex/values";

function generateSecureToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Bulk generate cards for a batch of riders
export const batchGenerateCards = mutation({
  args: {
    items: v.array(
      v.object({
        recipientIdentifier: v.string(),
        hubCode: v.string(),
        city: v.string(),
        payload: v.object({
          theme: v.string(),
          title: v.string(),
          rewardCode: v.string(),
          eventDates: v.optional(v.string()),
          shift: v.optional(v.string()),
          earnings: v.optional(v.string()),
          perOrderBonus: v.optional(v.string()),
          continuationBonus: v.optional(v.string()),
          specialOffer: v.optional(v.string()),
        }),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const results = [];

    for (const item of args.items) {
      const existing = await ctx.db
        .query("scratchCards")
        .withIndex("by_recipientIdentifier", (q) => q.eq("recipientIdentifier", item.recipientIdentifier))
        .first();

      if (existing) {
        results.push({
          riderId: existing.recipientIdentifier,
          accessKey: existing.accessKey ?? existing._id,
          status: "existing",
        });
      } else {
        const accessKey = generateSecureToken();
        await ctx.db.insert("scratchCards", {
          accessKey,
          recipientIdentifier: item.recipientIdentifier,
          hubCode: item.hubCode,
          city: item.city,
          status: "active",
          payload: item.payload,
          createdAt: now,
          expiresAt: now + 30 * 24 * 60 * 60 * 1000,
        });

        results.push({
          riderId: item.recipientIdentifier,
          accessKey,
          status: "created",
        });
      }
    }

    return results;
  },
});

// Track link open by accessKey or legacy ID
export const trackOpen = mutation({
  args: { accessKey: v.string() },
  handler: async (ctx, args) => {
    let card = await ctx.db
      .query("scratchCards")
      .withIndex("by_accessKey", (q) => q.eq("accessKey", args.accessKey))
      .first();

    if (!card) {
      card = await ctx.db
        .query("scratchCards")
        .withIndex("by_recipientIdentifier", (q) => q.eq("recipientIdentifier", args.accessKey))
        .first();
    }

    if (card && !card.openedAt) {
      await ctx.db.patch(card._id, { openedAt: Date.now() });
    }
  },
});

// Reveal card by accessKey or legacy ID
export const revealCard = mutation({
  args: { accessKey: v.string(), userAgent: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let card = await ctx.db
      .query("scratchCards")
      .withIndex("by_accessKey", (q) => q.eq("accessKey", args.accessKey))
      .first();

    if (!card) {
      card = await ctx.db
        .query("scratchCards")
        .withIndex("by_recipientIdentifier", (q) => q.eq("recipientIdentifier", args.accessKey))
        .first();
    }

    if (!card) throw new Error("CARD_NOT_FOUND");
    if (card.status === "scratched") throw new Error("ALREADY_SCRATCHED");

    const now = Date.now();
    if (card.expiresAt < now) throw new Error("CARD_EXPIRED");

    await ctx.db.patch(card._id, {
      status: "scratched",
      scratchedAt: now,
      userAgent: args.userAgent,
    });

    return card.payload;
  },
});