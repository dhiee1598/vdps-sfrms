import db from '~~/server/db';
import { strands } from '~~/server/db/schema/strands-schema';
import { and, eq, ne } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  // Require a user session (send back 401 if no `user` key in session)
  await requireUserSession(event);

  const id = Number(event.context.params?.id);
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID is required', message: 'ID is required' });
  }

  const body = await readBody(event);
  const [existingStrand] = await db.select().from(strands).where(and(eq(strands.strand_name, body.strand_name), ne(strands.id, id)));

  if (existingStrand) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: 'A Strand with this name already exists.',
    });
  }
  const result = await db.update(strands)
    .set({ strand_name: body.strand_name, strand_description: body.strand_description })
    .where(eq(strands.id, id))
    .execute();

  return { success: true, data: result, message: 'Strand updated successfully' };
});
