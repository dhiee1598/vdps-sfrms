import db from '~~/server/db';
import { gradeLevel } from '~~/server/db/schema/grade-level-schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id);
  const body = await readBody(event);
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID is required', message: 'ID is required' });
  }
  const [existingGradeLevel] = await db.select().from(gradeLevel).where(eq(gradeLevel.grade_level_name, gradeLevel.grade_level_name));

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Minimum of 3 and maximum of 50 characters allowed',
    });
  }
  else if (existingGradeLevel) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: 'A Grade level with this name already exists.',
    });
  }

  const result = await db.update(gradeLevel)
    .set({ grade_level_name: body.grade_level_name })
    .where(eq(gradeLevel.id, id))
    .execute();

  return { success: true, data: result, message: 'Grade level updated successfully' };
});
