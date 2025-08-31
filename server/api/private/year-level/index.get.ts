import db from '~~/server/db';
import { yearLevel } from '~~/server/db/schema/year-level-schema';

export default defineEventHandler(async () => {
  const allYearLevels = await db.select({ id: yearLevel.id, name: yearLevel.name, createdAt: yearLevel.createdAt }).from(yearLevel);
  return allYearLevels;
});
