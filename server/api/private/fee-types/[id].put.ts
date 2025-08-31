import db from '~~/server/db';
import { feeTypes } from '~~/server/db/schema/fee-type-schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id);
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID is required', message: 'ID is required' });
  }

  const body = await readBody(event);

  const result = await db.update(feeTypes)
    .set({ name: body.name })
    .where(eq(feeTypes.id, id))
    .execute();

  return { success: true, data: result };
});
