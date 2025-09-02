import db from '~~/server/db';
import { academicYears, academicYearsInsertSchema } from '~~/server/db/schema/academic-years-schema';
import { eq } from 'drizzle-orm';

// A Nuxt.js server route handler for creating a new academic year.
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, academicYearsInsertSchema.safeParse);

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Invalid data provided. Please check the required fields.',
    });
  }

  const { academic_year } = body.data;

  const [existingAcademicYear] = await db.select().from(academicYears).where(eq(academicYears.academic_year, academic_year));

  if (existingAcademicYear) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: 'An academic year with this name already exists.',
    });
  }

  const [createdAcademicYear] = await db.insert(academicYears).values({
    academic_year,
  }).$returningId();

  return {
    success: true,
    data: createdAcademicYear,
  };
});
