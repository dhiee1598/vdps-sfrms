import db from '~~/server/db';
import { semesters } from '~~/server/db/schema/semester-schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  let allSemesterYears;

  if (query.activeSemester) {
    allSemesterYears = await db.select().from(semesters).where(eq(semesters.status, true));
  }
  else {
    allSemesterYears = await db.select().from(semesters);
  }

  return {
    message: 'Fetch Academic Year Successfully',
    data: allSemesterYears,
  };
});
