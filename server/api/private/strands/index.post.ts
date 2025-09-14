import db from '~~/server/db';
import { strands, strandsInsertSchema } from '~~/server/db/schema/strands-schema';
import { eq } from 'drizzle-orm';
// A Nuxt.js server route handler for creating a new year level.
export default defineEventHandler(async (event) => {
  // Require a user session (send back 401 if no `user` key in session)
  await requireUserSession(event);

  // Read and validate the request body against the year level insertion schema.
  // The yearLevelInsertSchema.safeParse() method ensures type-safe and
  // robust validation, returning a result object for easy error handling.
  const body = await readValidatedBody(event, strandsInsertSchema.safeParse);

  // If validation fails, throw a 400 Bad Request error with a descriptive message.
  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: body.error,
      message: 'Invalid data provided. Please check the required fields.',
    });
  }

  // Destructure the validated data from the successful parsing result.
  const { strand_name, strand_description } = body.data;

  // Check if a year level with the same name already exists in the database.
  const [existingStrand] = await db.select().from(strands).where(eq(strands.strand_name, strand_name));

  // If a duplicate year level is found, throw a 409 Conflict error.
  if (existingStrand) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: 'A strand with this name already exists.',
    });
  }

  // Insert the new year level into the database and return the newly created record.
  // The .returning() method is used here to get the complete inserted object,
  // including the auto-generated ID, in a single, efficient operation.
  const [createdStrand] = await db.insert(strands).values({
    strand_name,
    strand_description,
  }).$returningId();

  // Return a success response along with the created year level data.
  // A 201 Created status code would be ideal for this operation.
  return {
    success: true,
    data: createdStrand,
    message: 'Strand created successfully.',
  };
});
