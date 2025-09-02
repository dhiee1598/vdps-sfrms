import db from '~~/server/db';
import { strands } from '~~/server/db/schema/strands-schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id);
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID is required', message: 'ID is required' });
  }

  const body = await readBody(event);

  const result = await db.update(strands)
    .set({ strand_name: body.strand_name, strand_description: body.strand_description })
    .where(eq(strands.id, id))
    .execute();

  return { success: true, data: result };
});
