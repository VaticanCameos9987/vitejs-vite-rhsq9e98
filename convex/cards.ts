import { mutation } from './_generated/server';
import { v } from 'convex/values';

// 1. The Secure One-Time Scratch Transaction
export const revealCard = mutation({
  args: {
    cardId: v.id('scratchCards'),
    clientIp: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId);

    if (!card) throw new Error('Card not found');
    if (card.status === 'scratched') throw new Error('ALREADY_SCRATCHED');
    if (card.status === 'expired' || card.expiresAt < Date.now()) {
      await ctx.db.patch(args.cardId, { status: 'expired' });
      throw new Error('CARD_EXPIRED');
    }

    // Atomic lock update
    await ctx.db.patch(args.cardId, {
      status: 'scratched',
      scratchedAt: Date.now(),
      clientIp: args.clientIp,
      userAgent: args.userAgent,
    });

    // Only release the payload if transaction succeeds
    return card.payload;
  },
});

// 2. Track Initiation (When link is opened)
export const trackOpen = mutation({
  args: { cardId: v.id('scratchCards') },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId);
    if (card && !card.openedAt) {
      await ctx.db.patch(args.cardId, { openedAt: Date.now() });
    }
  },
});

// 3. Generate a Targeted Card (For Admin Use)
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
      specialOffer: v.optional(v.string()),
      perOrderBonus: v.optional(v.string()),
      continuationBonus: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert('scratchCards', {
      recipientIdentifier: args.recipientIdentifier,
      status: 'active',
      payload: args.payload,
      createdAt: now,
      expiresAt: now + 24 * 60 * 60 * 1000,
    });
  },
});
