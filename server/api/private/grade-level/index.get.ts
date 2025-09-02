import db from '~~/server/db';
import { gradeLevel } from '~~/server/db/schema/grade-level-schema';

export default defineEventHandler(async () => {
  const allYearLevels = await db.select().from(gradeLevel);
  return allYearLevels;
});
