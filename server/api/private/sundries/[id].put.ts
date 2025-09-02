import db from '~~/server/db';
import { sundries } from '~~/server/db/schema/sundry-schema';
import { eq } from 'drizzle-orm';
import { readBody } from 'h3';

export default defineEventHandler(async (event) => {
  // ✅ 1. Parse ID from route params
  const id = Number(event.context.params?.id);
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid ID',
      message: 'Sundry ID is required in the request URL.',
    });
  }

  // ✅ 2. Read and validate body payload
  const body = await readBody<{
    sundry_name?: string;
    sundry_description?: string;
    sundry_amount?: string;
  }>(event);

  if (!body || !body.sundry_name || !body.sundry_amount) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing Fields',
      message: 'Name, Amount, and Type ID are required.',
    });
  }

  // ✅ 3. Run update query
  const result = await db
    .update(sundries)
    .set({
      sundry_name: body.sundry_name,
      sundry_description: body.sundry_description ?? null,
      sundry_amount: body.sundry_amount,
    })
    .where(eq(sundries.id, id))
    .execute();

  // ✅ 4. Return response
  return {
    success: true,
    message: `Sundry with ID ${id} updated successfully.`,
    data: result,
  };
});
