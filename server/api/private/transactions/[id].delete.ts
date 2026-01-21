import db from '~~/server/db';
import { transaction_items } from '~~/server/db/schema/transaction-items-schema';
import { transactions } from '~~/server/db/schema/transaction-schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Transaction ID is required',
    });
  }

  const [transaction] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.transaction_id, id));

  if (!transaction) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Transaction not found',
    });
  }

  if (transaction.status !== 'pending') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Only pending transactions can be cancelled',
    });
  }

  await db
    .delete(transaction_items)
    .where(eq(transaction_items.transaction_id, id));

  // Delete transaction
  await db.delete(transactions).where(eq(transactions.transaction_id, id));

  return {
    success: true,
    message: 'Transaction cancelled successfully',
  };
});
