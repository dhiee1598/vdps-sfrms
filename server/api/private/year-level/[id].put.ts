import db from '~~/server/db';
import { yearLevel } from '~~/server/db/schema/year-level-schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id);
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID is required', message: 'ID is required' });
  }

  const body = await readBody(event);

  const result = await db.update(yearLevel)
    .set({ name: body.name })
    .where(eq(yearLevel.id, id))
    .execute();

  return { success: true, data: result };
});
