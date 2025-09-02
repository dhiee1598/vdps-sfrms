import db from '~~/server/db';
import { academicYears } from '~~/server/db/schema/academic-years-schema';

export default defineEventHandler(async () => {
  const allAcademicYears = await db.select().from(academicYears);
  return allAcademicYears;
});
