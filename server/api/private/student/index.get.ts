import db from '~~/server/db';
import { students, studentSelectSchema } from '~~/server/db/schema/student-schema';

export default defineEventHandler(async (_event) => {
  const allStudents = await db.select().from(students);

  const parsedAllStudents = studentSelectSchema.array().parse(allStudents);

  return {
    message: 'Students fetched successfull',
    data: parsedAllStudents,
  };
});
