import db from '~~/server/db';
import { sectionInsertSchema, sections } from '~~/server/db/schema/section-schema';
import { eq } from 'drizzle-orm';

// A Nuxt.js server route handler for creating a new academic year.
export default defineEventHandler(async (event) => {
  // Require a user session (send back 401 if no `user` key in session)
  await requireUserSession(event);

  const body = await readValidatedBody(event, sectionInsertSchema.safeParse);

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Invalid data provided. Please check the required fields.',
    });
  }

  const { section_name } = body.data;

  const [existingAcademicYear] = await db.select().from(sections).where(eq(sections.section_name, section_name));

  if (existingAcademicYear) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: 'A section with this name already exists.',
    });
  }

  const [createdAcademicYear] = await db.insert(sections).values({
    section_name,
  }).$returningId();

  event.context.io.emit('newData', 'A section has been added.');

  return {
    success: true,
    message: 'Section Created Successfully',
    data: createdAcademicYear,
  };
});
