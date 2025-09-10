import db from '~~/server/db';
import { academicYears } from '~~/server/db/schema/academic-years-schema';
import { and, eq, ne } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id);
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID is required',
      message: 'ID is required',
    });
  }

  const body = await readBody(event);

  const [existingAcademicYear] = await db.select().from(academicYears).where(and(eq(academicYears.academic_year, body.academic_year), ne(academicYears.id, id)));
  if (existingAcademicYear) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: 'An academic year with this name already exists.',
    });
  }

  let result;
  if (body.academic_year) {
    result = await db
      .update(academicYears)
      .set({
        academic_year: body.academic_year,
      })
      .where(eq(academicYears.id, id))
      .execute();
  }
  else {
    await db.update(academicYears).set({ status: false }).execute();
    result = await db.update(academicYears).set({ status: true }).where(eq(academicYears.id, id)).execute();
  }

  event.context.io.emit('newData', 'A new academic year has been updated.');

  return { success: true, data: result, message: 'Academic year updated successfully' };
});
