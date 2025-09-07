import db from '~~/server/db';
import { fees } from '~~/server/db/schema/fees-schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id);
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID is required', message: 'ID is required' });
  }

  const body = await readBody(event);

  const [existingFee] = await db.select().from(fees).where(eq(fees.fee_name, body.fee_name));

  if (existingFee) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: 'A fee with this name already exists.',
    });
  }

  const result = await db.update(fees)
    .set({ fee_name: body.fee_name, fee_amount: body.fee_amount, fee_description: body.fee_description })
    .where(eq(fees.id, id))
    .execute();

  return { success: true, data: result, message: 'Fee updated successfully' };
});
