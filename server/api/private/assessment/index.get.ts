import db from '~~/server/db';
import { academicYears } from '~~/server/db/schema/academic-years-schema';
import { assessments, assessmentSelectSchema } from '~~/server/db/schema/asesssment-schema';
import { enrollments, enrollmentSelectSchema } from '~~/server/db/schema/enrollment-schema';
import { semesters } from '~~/server/db/schema/semester-schema';
import { students, studentSelectSchema } from '~~/server/db/schema/student-schema';
import { and, eq } from 'drizzle-orm';
import z from 'zod';

export const studentEnrolledAssessment = z.object({
  student: studentSelectSchema.nullable(),
  enrollment: enrollmentSelectSchema.nullable(),
  assessment: assessmentSelectSchema.nullable(),
});

export type StudentEnrolled = z.infer<typeof feeSchema>;

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const conditions = [];

  if (query.activeYear) {
    const [activeYear] = await db.select().from(academicYears);
    if (activeYear) {
      conditions.push(eq(enrollments.academic_year_id, activeYear.id));
    }
  }

  if (query.activeSemester) {
    const [activeSemester] = await db.select().from(semesters);
    if (activeSemester) {
      conditions.push(eq(enrollments.semester_id, activeSemester.id));
    }
  }

  let data;

  if (query.enrolled) {
    const results = await db
      .select({
        enrollment: enrollments,
        assessment: assessments,
        student: students,
      })
      .from(enrollments)
      .leftJoin(assessments, eq(assessments.enrollment_id, enrollments.id))
      .leftJoin(students, eq(students.id, enrollments.student_id))
      .where(and(...conditions));

    data = z.array(studentEnrolledAssessment).parse(results);
  }
  else {
    data = z.array(studentSelectSchema).parse(await db.select().from(students));
  }

  return {
    message: 'Students fetched successfully',
    data,
  };
});
