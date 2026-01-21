import db from '~~/server/db';
import {
  academicYears,
  academicYearsInsertSchema,
} from '~~/server/db/schema/academic-years-schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  const body = await readValidatedBody(
    event,
    academicYearsInsertSchema.safeParse,
  );

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Invalid data provided. Please check the required fields.',
    });
  }

  const { academic_year } = body.data;

  const [existingAcademicYear] = await db
    .select()
    .from(academicYears)
    .where(eq(academicYears.academic_year, academic_year));

  if (existingAcademicYear) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: 'An academic year with this name already exists.',
    });
  }

  const acadsYear = await db.select().from(academicYears);
  let isNew;
  if (acadsYear.length <= 0) {
    isNew = true;
  }
  else {
    isNew = false;
  }

  const [createdAcademicYear] = await db
    .insert(academicYears)
    .values({
      academic_year,
      status: isNew,
    })
    .$returningId();

  event.context.io.emit('newData', 'A new academic year has been added.');

  return {
    success: true,
    message: 'Academic Year Created Successfully',
    data: createdAcademicYear,
  };
});
