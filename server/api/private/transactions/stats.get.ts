import db from '~~/server/db';
import { transactions } from '~~/server/db/schema/transaction-schema';
import { and, eq, gte, lte, sql } from 'drizzle-orm';

export default defineEventHandler(async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // 1. Pending Count
  const pendingResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(eq(transactions.status, 'pending'));

  const pendingCount = pendingResult[0]?.count || 0;

  const todayPaidResult = await db
    .select({
      count: sql<number>`count(*)`,
      totalAmount: sql<string>`sum(${transactions.total_amount})`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.status, 'paid'),
        gte(transactions.date_paid, today),
        lte(transactions.date_paid, tomorrow),
      ),
    );

  const todayPaidCount = todayPaidResult[0]?.count || 0;
  const todayPaidAmount = Number(todayPaidResult[0]?.totalAmount || 0);

  return {
    pendingCount,
    todayPaidCount,
    todayPaidAmount,
  };
});
