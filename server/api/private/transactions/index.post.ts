import db from '~~/server/db';
import { transaction_items } from '~~/server/db/schema/transaction-items-schema';
import { transactions, transactionsInsertSchema } from '~~/server/db/schema/transaction-schema';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // Validate main transaction
  const validatedTransaction = transactionsInsertSchema.parse({
    assessment_id: body.assessment_id,
    student_id: body.student_id,
    total_amount: body.total_amount,

  });

  // Generate UUID for transaction_id
  const transactionId = uuidv4();

  // Insert main transaction
  await db.insert(transactions).values({
    transaction_id: transactionId, // string UUID
    assessment_id: validatedTransaction.assessment_id,
    student_id: validatedTransaction.student_id,
    total_amount: validatedTransaction.total_amount.toFixed(2), // <-- convert to string

  });

  // Validate and prepare transaction items
  const itemsToInsert = body.transaction_items.map((item: any) => {
    return {
      transaction_id: transactionId,
      item_type: item.payment_type, // e.g., "Downpayment" or sundry name
      amount: Number(item.amount.toFixed(2)), // ensure decimal precision
    };
  });

  // Insert items
  await db.insert(transaction_items).values(itemsToInsert);

  return { success: true, transaction_id: transactionId };
});
