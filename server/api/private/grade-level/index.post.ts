import db from '~~/server/db';
import {
  gradeLevel,
  gradeLevelInsertSchema,
} from '~~/server/db/schema/grade-level-schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  const body = await readValidatedBody(event, gradeLevelInsertSchema.safeParse);

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Invalid data provided. Please check the required fields.',
    });
  }

  const { grade_level_name } = body.data;

  const [existingGradeLevel] = await db
    .select()
    .from(gradeLevel)
    .where(eq(gradeLevel.grade_level_name, grade_level_name));

  if (existingGradeLevel) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: 'A Grade level with this name already exists.',
    });
  }

  const [createdGradeLevel] = await db
    .insert(gradeLevel)
    .values({
      grade_level_name,
    })
    .$returningId();

  return {
    success: true,
    data: createdGradeLevel,
    message: 'Grade level created successfully',
  };
});
