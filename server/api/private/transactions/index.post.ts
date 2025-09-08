import db from '~~/server/db';
import { transaction_items, transactionItemInsertSchema } from '~~/server/db/schema/transaction-items-schema';
import { transactions, transactionsInsertSchema } from '~~/server/db/schema/transaction-schema';
import { v4 as uuidv4 } from 'uuid';
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

  const transactionId = uuidv4();

  const result = await db.transaction(async (tx) => {
    const [newTransaction] = await tx.insert(transactions).values({
      transaction_id: transactionId,
      assessment_id: body.data.assessment_id,
      student_id: body.data.student_id,
      total_amount: body.data.total_amount.toFixed(2),
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

  event.context.io.emit('newStudentAssessment', 'A new payment has been inserted.');

  return { success: true, data: result };
});
