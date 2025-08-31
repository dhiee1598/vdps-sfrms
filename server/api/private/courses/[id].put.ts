import db from '~~/server/db';
import { course } from '~~/server/db/schema/course-schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id);
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID is required', message: 'ID is required' });
  }

  const body = await readBody(event);

  const result = await db.update(course)
    .set({ course_name: body.course_name, course_description: body.course_description })
    .where(eq(course.id, id))
    .execute();

  return { success: true, data: result };
});
