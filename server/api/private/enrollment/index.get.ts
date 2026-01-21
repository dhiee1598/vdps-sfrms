import db from '~~/server/db';
import { academicYears } from '~~/server/db/schema/academic-years-schema';
import { enrollments } from '~~/server/db/schema/enrollment-schema';
import { gradeLevel } from '~~/server/db/schema/grade-level-schema';
import { sections } from '~~/server/db/schema/section-schema';
import { strands } from '~~/server/db/schema/strands-schema';
import { students } from '~~/server/db/schema/student-schema';
import { and, asc, eq, like, or, sql } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const conditions = [];

  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 8;
  const search = (query.search as string) || '';
  const gradeLevelFilter = (query.gradeLevel as string) || '';
  const strandFilter = (query.strand as string) || '';
  const offset = (page - 1) * pageSize;

  const [activeYear] = await db
    .select()
    .from(academicYears)
    .where(eq(academicYears.status, true));

  if (activeYear) {
    conditions.push(eq(enrollments.academic_year_id, activeYear.id));
  }

  if (search) {
    conditions.push(
      or(
        like(students.first_name, `%${search}%`),
        like(students.last_name, `%${search}%`),
        eq(students.id, search), // Exact match for Student ID
      ),
    );
  }

  if (gradeLevelFilter) {
    conditions.push(eq(gradeLevel.grade_level_name, gradeLevelFilter));
  }

  if (strandFilter) {
    conditions.push(eq(strands.strand_name, strandFilter));
  }

  const totalCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(enrollments)
    .leftJoin(students, eq(students.id, enrollments.student_id))
    .leftJoin(gradeLevel, eq(gradeLevel.id, enrollments.grade_level_id))
    .leftJoin(strands, eq(strands.id, enrollments.strand_id))
    .leftJoin(academicYears, eq(academicYears.id, enrollments.academic_year_id))
    .leftJoin(sections, eq(sections.id, enrollments.section_id))
    .where(and(...conditions));

  const total = Number(totalCountResult[0]?.count || 0);

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
      grade_level_id: gradeLevel.id,
      strand_name: strands.strand_name,
      strand_id: strands.id,
      academic_year: academicYears.academic_year,
      date_enrolled: enrollments.date_enrolled,
      createdAt: enrollments.createdAt,
      section_name: sections.section_name,
    })
    .from(enrollments)
    .leftJoin(students, eq(students.id, enrollments.student_id))
    .leftJoin(gradeLevel, eq(gradeLevel.id, enrollments.grade_level_id))
    .leftJoin(strands, eq(strands.id, enrollments.strand_id))
    .leftJoin(academicYears, eq(academicYears.id, enrollments.academic_year_id))
    .leftJoin(sections, eq(sections.id, enrollments.section_id))
    .orderBy(asc(students.last_name))
    .where(and(...conditions))
    .limit(pageSize)
    .offset(offset);

  return {
    success: true,
    data: enrolledStudents,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
});
