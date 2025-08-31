import db from '~~/server/db';
import { course } from '~~/server/db/schema/course-schema';

export default defineEventHandler(async () => {
  const allCourses = await db.select().from(course);
  return allCourses;
});
