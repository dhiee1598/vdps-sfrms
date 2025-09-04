import db from '~~/server/db';
import { academicYears } from '~~/server/db/schema/academic-years-schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  let allAcademicYears;

  if (query.activeYear) {
    allAcademicYears = await db.select().from(academicYears).where(eq(academicYears.status, true));
  }
  else {
    allAcademicYears = await db.select().from(academicYears);
  }

  return {
    message: 'Fetch Academic Year Successfully',
    data: allAcademicYears,
  };
});
