import db from '~~/server/db';
import { academicYears } from '~~/server/db/schema/academic-years-schema';
import { assessments } from '~~/server/db/schema/asesssment-schema';
import { enrollments } from '~~/server/db/schema/enrollment-schema';
import { semesters } from '~~/server/db/schema/semester-schema';
import { students } from '~~/server/db/schema/student-schema';
import { and, eq, isNull } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const conditions = [];

  // Active Year
  const [activeYear] = await db
    .select()
    .from(academicYears)
    .where(eq(academicYears.status, true));

  if (activeYear) {
    conditions.push(eq(enrollments.academic_year_id, activeYear.id));
  }

  // Active Semester
  const [activeSemester] = await db
    .select()
    .from(semesters)
    .where(eq(semesters.status, true));

  if (activeSemester) {
    conditions.push(eq(enrollments.semester_id, activeSemester.id));
  }

  if (query.withoutAssessment) {
    conditions.push(isNull(assessments.id));
  }

  const allEnrollments = await db
    .select({
      id: enrollments.id,
      student_id: students.id,
      first_name: students.first_name,
      middle_name: students.middle_name,
      last_name: students.last_name,
      address: students.address,
      contact_number: students.contact_number,
      enroll_status: enrollments.enroll_status,
    })
    .from(enrollments)
    .leftJoin(students, eq(enrollments.student_id, students.id))
    .leftJoin(assessments, eq(enrollments.id, assessments.enrollment_id))
    .where(and(...conditions));

  return {
    message: 'Enrollments fetched successfully',
    data: allEnrollments,
  };
});
