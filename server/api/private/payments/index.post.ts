import db from '~~/server/db';
import { payments, paymentsInsertSchema } from '~~/server/db/schema/payments-schema';

export default defineEventHandler(async (event) => {
  // Wrap Zod in a validator function
  const body = await readValidatedBody(event, data => paymentsInsertSchema.parse(data));

  const { assessment_id, student_id, amount, payment_type } = body;

  const result = await db.insert(payments).values({
    assessment_id,
    student_id,
    amount,
    payment_type,
    status: 'pending', // ✅ set default if you want
  }).execute();

  return {
    success: true,
    insertedId: result[0].insertId,
    message: 'Payment created successfully',
  };
});
