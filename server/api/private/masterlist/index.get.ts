import db from '~~/server/db';
import { academicYears } from '~~/server/db/schema/academic-years-schema';
import { enrollments, enrollmentSelectSchema } from '~~/server/db/schema/enrollment-schema';
import { semesters } from '~~/server/db/schema/semester-schema';
import { students, studentSelectSchema } from '~~/server/db/schema/student-schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

const enrollmentWithStudentSchema = z.object({
  enrollment: enrollmentSelectSchema,
  student: studentSelectSchema.nullable(),
});

export default defineEventHandler(async () => {
  const conditions = [];

  // Get Active Year
  const [activeYear] = await db.select().from(academicYears).where(eq(academicYears.status, true));

  if (activeYear) {
    conditions.push(eq(enrollments.academic_year_id, activeYear.id));
  }

  // Get Active Semester
  const [activeSemester] = await db.select().from(semesters).where(eq(semesters.status, true));

  if (activeSemester) {
    conditions.push(eq(enrollments.semester_id, activeSemester.id));
  }

  const allEnrollments = await db
    .select({
      enrollment: enrollments,
      student: students,
    })
    .from(enrollments)
    .leftJoin(students, eq(enrollments.student_id, students.id))
    .where(and(...conditions));

  const parsedAllEnrollments = enrollmentWithStudentSchema.array().parse(allEnrollments);

  return {
    message: 'Enrollments fetched successfully',
    data: parsedAllEnrollments,
  };
});
