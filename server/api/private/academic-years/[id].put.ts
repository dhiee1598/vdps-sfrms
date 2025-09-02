import db from '~~/server/db';
import { academicYears } from '~~/server/db/schema/academic-years-schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id);
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID is required', message: 'ID is required' });
  }

  const body = await readBody(event);

  const result = await db.update(academicYears)
    .set({ academic_year: body.academic_year, status: body.status })
    .where(eq(academicYears.id, id))
    .execute();

  return { success: true, data: result };
});
