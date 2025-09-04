import db from '~~/server/db';
import { academicYears } from '~~/server/db/schema/academic-years-schema';
import { enrollments, enrollmentSelectSchema } from '~~/server/db/schema/enrollment-schema';
import { semesters } from '~~/server/db/schema/semester-schema';
import { students, studentSelectSchema } from '~~/server/db/schema/student-schema';
import { and, eq, isNull, not } from 'drizzle-orm';
import { getQuery } from 'h3';
import { z } from 'zod';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const enrolled = query.enrolled === 'true';

  // get active academic year
  const activeYear = (await db
    .select({ year: academicYears })
    .from(academicYears)
    .where(eq(academicYears.status, true))
    .limit(1))[0]?.year;

  // get active semester
  const activeSemester = (await db
    .select({ semester: semesters })
    .from(semesters)
    .where(eq(semesters.status, true))
    .orderBy(semesters.id)
    .limit(1))[0]?.semester;

  if (enrolled && activeYear && activeSemester) {
    // fetch students who are NOT enrolled in the active year and semester
    const notEnrolledStudents = await db
      .select({ student: students })
      .from(students)
      .leftJoin(enrollments, and(
        eq(enrollments.student_id, students.id),
        eq(enrollments.academic_year_id, activeYear.id),
        eq(enrollments.semester_id, activeSemester.id),
      ))
      .where(isNull(enrollments.student_id)); // only students without enrollment in current year/semester

    const parsed = studentSelectSchema.array().parse(notEnrolledStudents.map(s => s.student));

    return {
      message: 'Not enrolled students fetched successfully',
      data: parsed,
    };
  }

  // fetch all students otherwise
  const allStudents = await db.select().from(students);
  const parsedAll = studentSelectSchema.array().parse(allStudents);

  return {
    message: 'All students fetched successfully',
    data: parsedAll,
  };
});
