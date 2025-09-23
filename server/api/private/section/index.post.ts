import db from '~~/server/db';
import { sectionInsertSchema, sections } from '~~/server/db/schema/section-schema';
import { eq } from 'drizzle-orm';

// A Nuxt.js server route handler for creating a new academic year.
export default defineEventHandler(async (event) => {
  // Require a user session (send back 401 if no `user` key in session)
  await requireUserSession(event);

  const body = await readBody(event);

  // if (!body.success) {
  //   throw createError({
  //     statusCode: 400,
  //     statusMessage: 'Bad Request',
  //     message: 'Invalid data provided. Please check the required fields.',
  //   });
  // }

  const { grade_level_id, section_names } = body;

  // Ensure section_names is an array and has at least one value
  if (!Array.isArray(section_names) || section_names.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Please provide an array of section names.',
    });
  }

  const insertedSections = await db
    .insert(sections)
    .values(
      section_names.map(section_name => ({
        grade_level_id,
        section_name,
      })),
    )
    .$returningId();

  event.context.io.emit('newData', 'A section has been added.');

  return {
    success: true,
    message: 'Section Created Successfully',
    data: insertedSections,
  };
});
