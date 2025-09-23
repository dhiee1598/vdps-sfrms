import db from '~~/server/db';
import { academicYears } from '~~/server/db/schema/academic-years-schema';
import { assessments } from '~~/server/db/schema/asesssment-schema';
import { enrollments } from '~~/server/db/schema/enrollment-schema';
import { gradeLevel } from '~~/server/db/schema/grade-level-schema';
import { sections } from '~~/server/db/schema/section-schema';
import { semesters } from '~~/server/db/schema/semester-schema';
import { strands } from '~~/server/db/schema/strands-schema';
import { students } from '~~/server/db/schema/student-schema';
import { and, asc, eq, isNull } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const conditions = [];
  const query = getQuery(event);

  // ✅ Get Active Year
  const [activeYear] = await db
    .select()
    .from(academicYears)
    .where(eq(academicYears.status, true));

  if (activeYear) {
    conditions.push(eq(enrollments.academic_year_id, activeYear.id));
  }

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

  const enrolledStudents = await db
    .select({
      id: enrollments.id,
      enroll_status: enrollments.enroll_status,
      student_id: students.id,
      first_name: students.first_name,
      middle_name: students.middle_name,
      last_name: students.last_name,
      address: students.address,
      contact_number: students.contact_number,
      grade_level: gradeLevel.grade_level_name,
      strand_name: strands.strand_name,
      semester: semesters.semester,
      academic_year: academicYears.academic_year,
      date_enrolled: enrollments.date_enrolled,
      createdAt: enrollments.createdAt,
      section_name: sections.section_name,
    })
    .from(enrollments)
    .leftJoin(students, eq(students.id, enrollments.student_id))
    .leftJoin(assessments, eq(assessments.enrollment_id, enrollments.id))
    .leftJoin(gradeLevel, eq(gradeLevel.id, enrollments.grade_level_id))
    .leftJoin(strands, eq(strands.id, enrollments.strand_id))
    .leftJoin(semesters, eq(semesters.id, enrollments.semester_id))
    .leftJoin(academicYears, eq(academicYears.id, enrollments.academic_year_id))
    .leftJoin(sections, eq(sections.id, enrollments.section_id))
    .orderBy(asc(students.last_name))
    .where(and(...conditions)); ;

  return {
    success: true,
    count: enrolledStudents.length,
    data: enrolledStudents,
  };
});
