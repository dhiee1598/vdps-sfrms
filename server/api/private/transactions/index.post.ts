import db from '~~/server/db';
import { assessments } from '~~/server/db/schema/asesssment-schema';
import { transaction_items, transactionItemInsertSchema } from '~~/server/db/schema/transaction-items-schema';
import { transactions, transactionsInsertSchema } from '~~/server/db/schema/transaction-schema';
import { eq } from 'drizzle-orm';
import z from 'zod';

export default defineEventHandler(async (event) => {
  await new Promise(resolve => setTimeout(resolve, 3000));

  const requestBody = transactionsInsertSchema.extend({
    transaction_items: z.array(transactionItemInsertSchema),
  });

  const body = await readValidatedBody(event, requestBody.safeParse);

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: body.error.message,
    });
  }

  const result = await db.transaction(async (tx) => {
    const [newTransaction] = await tx.insert(transactions).values({
      transaction_id: body.data.transaction_id,
      assessment_id: body.data.assessment_id,
      student_id: body.data.student_id,
      total_amount: body.data.total_amount.toFixed(2),
      status: body.data.status ? 'paid' : 'pending',
    }).$returningId();

    if (body.data.transaction_items.length > 0) {
      await tx.insert(transaction_items).values(
        body.data.transaction_items.map(item => ({
          transaction_id: newTransaction.transaction_id ?? newTransaction.transaction_id,
          item_type: item.item_type,
          amount: item.amount.toFixed(2),
        })),
      );
    }
  });

  if (body.data.status === 'paid') {
    const [current] = await db
      .select({ total_paid: assessments.total_paid })
      .from(assessments)
      .where(eq(assessments.id, body.data.assessment_id))
      .execute();

    const newTotalPaid = Number.parseFloat(current.total_paid || '0') + body.data.total_amount;

    await db
      .update(assessments)
      .set({
        total_paid: newTotalPaid.toFixed(2),
      })
      .where(eq(assessments.id, body.data.assessment_id))
      .execute();
  }

  event.context.io.emit('newData', 'A new transactions has been added.');
  event.context.io.emit('newTransaction', 'A new transactions has been added.');

  return { success: true, data: result, message: 'Transaction created successfully.' };
});
