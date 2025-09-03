import db from '~~/server/db';
import { semesters } from '~~/server/db/schema/semester-schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id);
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID is required', message: 'ID is required' });
  }

  const body = await readBody(event);

  const result = await db.update(semesters)
    .set({ semester: body.semester, status: body.status })
    .where(eq(semesters.id, id))
    .execute();

  return { success: true, data: result };
});
