import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  scratchCards: defineTable({
    recipientIdentifier: v.string(),
    status: v.union(
      v.literal('active'),
      v.literal('scratched'),
      v.literal('expired')
    ),

    payload: v.object({
      theme: v.string(),
      title: v.string(),
      rewardCode: v.string(),
      // Added fields for rich gig payloads
      eventDates: v.optional(v.string()),
      shift: v.optional(v.string()),
      earnings: v.optional(v.string()),
      specialOffer: v.optional(v.string()),
      perOrderBonus: v.optional(v.string()),
      continuationBonus: v.optional(v.string()),
    }),

    createdAt: v.number(),
    expiresAt: v.number(),

    openedAt: v.optional(v.number()),
    scratchedAt: v.optional(v.number()),
    clientIp: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  }).index('by_status', ['status']),
});
