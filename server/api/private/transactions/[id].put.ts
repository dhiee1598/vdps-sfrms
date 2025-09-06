import db from '~~/server/db';
import { transactions } from '~~/server/db/schema/transaction-schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = String(event.context.params?.id);
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID is required',
      message: 'ID is required',
    });
  }

  const body = await readBody(event);

  await db
    .update(transactions)
    .set({
      status: body.status,
    })
    .where(eq(transactions.transaction_id, id))
    .execute();

  return { success: true, message: 'Transaction updated successfully' };
});
