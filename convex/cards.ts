import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const generateCard = mutation({
  args: {
    recipientIdentifier: v.string(),
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
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("scratchCards")
      .withIndex("by_recipientIdentifier", (q) => q.eq("recipientIdentifier", args.recipientIdentifier))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("scratchCards", {
      recipientIdentifier: args.recipientIdentifier,
      status: "active",
      payload: args.payload,
      createdAt: now,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000,
    });
  },
});

export const trackOpen = mutation({
  args: { riderId: v.string() },
  handler: async (ctx, args) => {
    const card = await ctx.db
      .query("scratchCards")
      .withIndex("by_recipientIdentifier", (q) => q.eq("recipientIdentifier", args.riderId))
      .first();

    if (card && !card.openedAt) {
      await ctx.db.patch(card._id, { openedAt: Date.now() });
    }
  },
});

export const revealCard = mutation({
  args: { riderId: v.string(), userAgent: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const card = await ctx.db
      .query("scratchCards")
      .withIndex("by_recipientIdentifier", (q) => q.eq("recipientIdentifier", args.riderId))
      .first();

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