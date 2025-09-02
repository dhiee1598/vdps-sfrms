import db from '~~/server/db';
import { gradeLevel } from '~~/server/db/schema/grade-level-schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id);
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID is required', message: 'ID is required' });
  }

  const body = await readBody(event);

  const result = await db.update(gradeLevel)
    .set({ grade_level_name: body.grade_level_name })
    .where(eq(gradeLevel.id, id))
    .execute();

  return { success: true, data: result };
});
