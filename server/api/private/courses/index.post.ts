import db from '~~/server/db';
import { course, courseInsertSchema } from '~~/server/db/schema/course-schema';
import { eq } from 'drizzle-orm';
// A Nuxt.js server route handler for creating a new year level.
export default defineEventHandler(async (event) => {
  // Read and validate the request body against the year level insertion schema.
  // The yearLevelInsertSchema.safeParse() method ensures type-safe and
  // robust validation, returning a result object for easy error handling.
  const body = await readValidatedBody(event, courseInsertSchema.safeParse);

  // If validation fails, throw a 400 Bad Request error with a descriptive message.
  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Invalid data provided. Please check the required fields.',
    });
  }

  // Destructure the validated data from the successful parsing result.
  const { course_name, course_description } = body.data;

  // Check if a year level with the same name already exists in the database.
  const [existingCourse] = await db.select().from(course).where(eq(course.course_name, course_name));

  // If a duplicate year level is found, throw a 409 Conflict error.
  if (existingCourse) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: 'A year level with this name already exists.',
    });
  }

  // Insert the new year level into the database and return the newly created record.
  // The .returning() method is used here to get the complete inserted object,
  // including the auto-generated ID, in a single, efficient operation.
  const [createdCourse] = await db.insert(course).values({
    course_name,
    course_description,
  }).$returningId();

  // Return a success response along with the created year level data.
  // A 201 Created status code would be ideal for this operation.
  return {
    success: true,
    data: createdCourse,
  };
});
