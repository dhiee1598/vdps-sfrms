import db from '~~/server/db';
import { enrollments, enrollmentSelectSchema } from '~~/server/db/schema/enrollment-schema';
import { students, studentSelectSchema } from '~~/server/db/schema/student-schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const enrollmentWithStudentSchema = z.object({
  enrollment: enrollmentSelectSchema,
  student: studentSelectSchema.nullable(), // leftJoin can return null
});

export default defineEventHandler(async () => {
  const allEnrollments = await db
    .select({
      enrollment: enrollments,
      student: students,
    })
    .from(enrollments)
    .leftJoin(students, eq(enrollments.student_id, students.id));

  const parsedAllEnrollments = enrollmentWithStudentSchema.array().parse(allEnrollments);

  return {
    message: 'Enrollments fetched successfully',
    data: parsedAllEnrollments,
  };
});
