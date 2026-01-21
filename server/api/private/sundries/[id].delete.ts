import db from '~~/server/db';
import { sundries } from '~~/server/db/schema/sundry-schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID is required',
    });
  }

  await db
    .update(sundries)
    .set({ is_archived: true })
    .where(eq(sundries.id, Number(id)));

  return {
    message: 'Sundry archived successfully',
  };
});
