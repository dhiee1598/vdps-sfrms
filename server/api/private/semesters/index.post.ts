import db from '~~/server/db';
import { semesters, semestersInsertSchema } from '~~/server/db/schema/semester-schema';
import { eq } from 'drizzle-orm';

// A Nuxt.js server route handler for creating a new academic year.
export default defineEventHandler(async (event) => {
  // Require a user session (send back 401 if no `user` key in session)
  await requireUserSession(event);

  const body = await readValidatedBody(event, semestersInsertSchema.safeParse);

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Invalid data provided. Please check the required fields.',
    });
  }

  const { semester } = body.data;

  const [existingSemester] = await db.select().from(semesters).where(eq(semesters.semester, semester));

  if (existingSemester) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: 'An academic year with this name already exists.',
    });
  }

  const [createdSemester] = await db.insert(semesters).values({
    semester,
  }).$returningId();

  event.context.io.emit('newData', 'A new semester has been added.');

  return {
    success: true,
    data: createdSemester,
    message: 'Semester created successfully',
  };
});
