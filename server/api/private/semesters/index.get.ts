import db from '~~/server/db';
import { semesters } from '~~/server/db/schema/semester-schema';

export default defineEventHandler(async () => {
  const allSemesterYears = await db.select().from(semesters);
  return allSemesterYears;
});
