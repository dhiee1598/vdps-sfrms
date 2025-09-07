import db from '~~/server/db';
import { academicYears } from '~~/server/db/schema/academic-years-schema';
import { enrollments } from '~~/server/db/schema/enrollment-schema';
import { semesters } from '~~/server/db/schema/semester-schema';
import { students, studentSelectSchema } from '~~/server/db/schema/student-schema';
import { and, eq, isNull, ne } from 'drizzle-orm';
import { getQuery } from 'h3';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const enrolled = query.enrolled === 'true';
  const carryOver = query.carryOver === 'true';

  // 1. get active academic year
  const activeYear = (await db
    .select({ year: academicYears })
    .from(academicYears)
    .where(eq(academicYears.status, true))
    .limit(1))[0]?.year;

  // // 2. get active semester
  // const activeSemester = (await db
  //   .select({ semester: semesters })
  //   .from(semesters)
  //   .where(eq(semesters.status, true))
  //   .orderBy(semesters.id)
  //   .limit(1))[0]?.semester;

  // if (!activeYear || !activeSemester) {
  //   return { message: 'No active academic year/semester found', data: [] };
  // }

  if (enrolled) {
    // 🔹 Students NOT enrolled in the current active year/semester
    const notEnrolledStudents = await db
      .select({ student: students })
      .from(students)
      .leftJoin(
        enrollments,
        and(
          eq(enrollments.student_id, students.id),
          eq(enrollments.academic_year_id, activeYear.id),
          // eq(enrollments.semester_id, activeSemester.id),
        ),
      )
      .where(isNull(enrollments.student_id));

    const parsed = studentSelectSchema.array().parse(notEnrolledStudents.map(s => s.student));

    return {
      message: 'Not enrolled students (current year/semester)',
      data: parsed,
    };
  }

  if (carryOver) {
    // 🔹 Students who are enrolled, but only in a *different* academic year (previous year)
    const prevEnrolled = await db
      .select({ student: students })
      .from(students)
      .innerJoin(
        enrollments,
        and(
          eq(enrollments.student_id, students.id),
          ne(enrollments.academic_year_id, activeYear.id), // not in current year
        ),
      );

    const parsed = studentSelectSchema.array().parse(prevEnrolled.map(s => s.student));

    return {
      message: 'Previously enrolled students (carry over to new year)',
      data: parsed,
    };
  }

  // 🔹 fallback → all students
  const allStudents = await db.select().from(students);
  const parsedAll = studentSelectSchema.array().parse(allStudents);

  return {
    message: 'All students fetched successfully',
    data: parsedAll,
  };
});
