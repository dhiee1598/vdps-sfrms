import db from '~~/server/db';
import { gradeLevel, gradeLevelInsertSchema } from '~~/server/db/schema/grade-level-schema';
import { and, eq, ne } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id);
  const body = await readValidatedBody(event, gradeLevelInsertSchema.safeParse);

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID is required', message: 'ID is required' });
  }

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Minimum of 3 and maximum of 50 characters allowed',
    });
  }

  const [existingGradeLevel] = await db.select().from(gradeLevel).where(and(eq(gradeLevel.grade_level_name, body.data.grade_level_name), ne(gradeLevel.id, id)));

  if (existingGradeLevel) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: 'A Grade level with this name already exists.',
    });
  }

  const result = await db.update(gradeLevel)
    .set({ grade_level_name: body.data.grade_level_name })
    .where(eq(gradeLevel.id, id))
    .execute();

  return { success: true, data: result, message: 'Grade level updated successfully' };
});
