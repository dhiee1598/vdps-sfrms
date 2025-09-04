import db from '~~/server/db';
import { enrollments } from '~~/server/db/schema/enrollment-schema';
import { students, studentSelectSchema } from '~~/server/db/schema/student-schema';
import { eq, isNull } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const enrolled = query.enrolled === 'true';
  let allStudents;

  if (enrolled) {
    allStudents = await db
      .select({
        student: students,
      })
      .from(students)
      .leftJoin(enrollments, eq(enrollments.student_id, students.id))
      .where(isNull(enrollments.student_id)); // ✅ only students with no enrollment
  }
  else {
    allStudents = await db.select().from(students);
  }

  const parsedAllStudents = studentSelectSchema.array().parse(allStudents);
  return {
    message: 'Students fetched successfully',
    data: parsedAllStudents,
  };
});
