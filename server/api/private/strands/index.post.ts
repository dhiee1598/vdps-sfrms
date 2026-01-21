import db from '~~/server/db';
import {
  strands,
  strandsInsertSchema,
} from '~~/server/db/schema/strands-schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  const body = await readValidatedBody(event, strandsInsertSchema.safeParse);

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: body.error,
      message: 'Invalid data provided. Please check the required fields.',
    });
  }

  const { strand_name, strand_description } = body.data;

  const [existingStrand] = await db
    .select()
    .from(strands)
    .where(eq(strands.strand_name, strand_name));

  if (existingStrand) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: 'A strand with this name already exists.',
    });
  }

  const [createdStrand] = await db
    .insert(strands)
    .values({
      strand_name,
      strand_description,
    })
    .$returningId();

  return {
    success: true,
    data: createdStrand,
    message: 'Strand created successfully.',
  };
});
