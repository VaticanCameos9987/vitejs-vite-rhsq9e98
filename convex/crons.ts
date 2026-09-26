import { cronJobs } from 'convex/server';
import { internalMutation } from './_generated/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// The internal logic that sweeps the database
export const expireOldCards = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const activeCards = await ctx.db
      .query('scratchCards')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .collect();

    for (const card of activeCards) {
      if (card.expiresAt < now) {
        await ctx.db.patch(card._id, { status: 'expired' });
      }
    }
  },
});

// Schedule the sweep every 15 minutes
crons.interval(
  'expire-cards-job',
  { minutes: 15 },
  internal.crons.expireOldCards
);

export default crons;
