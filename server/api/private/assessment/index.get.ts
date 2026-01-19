import db from "~~/server/db";
import { academicYears } from "~~/server/db/schema/academic-years-schema";
import { assessmentFees } from "~~/server/db/schema/assessment-fees-schema";
import {
  enrollments,
  enrollmentSelectSchema,
} from "~~/server/db/schema/enrollment-schema";
import { fees } from "~~/server/db/schema/fees-schema";
import { gradeLevel } from "~~/server/db/schema/grade-level-schema";
import { sections } from "~~/server/db/schema/section-schema";
import { strands } from "~~/server/db/schema/strands-schema";
import {
  students,
  studentSelectSchema,
} from "~~/server/db/schema/student-schema";
import { and, eq, or, isNull, like, sql, inArray, desc } from "drizzle-orm";
import z from "zod";
import { gradeLevelFees } from "~~/server/db/schema/grade-level-fees-schema";
import {
  assessments,
  assessmentSelectSchema,
} from "~~/server/db/schema/asesssment-schema";

export const studentEnrolledAssessment = z.object({
  student: studentSelectSchema.nullable(),
  enrollment: enrollmentSelectSchema.nullable(),
  assessment: assessmentSelectSchema.nullable(),
});

export default defineEventHandler(async (_event) => {
  const query = getQuery(_event);
  const conditions = [];

  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 8;
  const search = (query.search as string) || "";
  const offset = (page - 1) * pageSize;

  if (query.allAssessments === "true") {
  } else {
    const [activeYear] = await db
      .select()
      .from(academicYears)
      .where(eq(academicYears.status, true));

    if (activeYear) {
      conditions.push(eq(enrollments.academic_year_id, activeYear.id));
    }
  }

  if (search) {
    conditions.push(
      or(
        like(students.first_name, `%${search}%`),
        like(students.last_name, `%${search}%`),
        like(students.middle_name, `%${search}%`),
        like(students.id, `%${search}%`),
      ),
    );
  }

  const baseQuery = db
    .select({ id: assessments.id })
    .from(assessments)
    .leftJoin(students, eq(students.id, assessments.student_id))
    .leftJoin(enrollments, eq(enrollments.id, assessments.enrollment_id))
    .where(and(...conditions));

  const totalCountResult = await db
    .select({ count: sql<number>`count(distinct ${assessments.id})` })
    .from(assessments)
    .leftJoin(students, eq(students.id, assessments.student_id))
    .leftJoin(enrollments, eq(enrollments.id, assessments.enrollment_id))
    .where(and(...conditions));

  const total = Number(totalCountResult[0]?.count || 0);

  const pagedIds = await baseQuery
    .limit(pageSize)
    .offset(offset)
    .orderBy(desc(assessments.id));

  const ids = pagedIds.map((r) => r.id);

  if (ids.length === 0) {
    return {
      success: true,
      data: [],
      total,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  const rows = await db
    .select({
      assessment: assessments,
      enrollment: enrollments,
      student: students,
      assessmentFees,
      fee: {
        id: fees.id,
        fee_name: fees.fee_name,
        fee_description: fees.fee_description,
        amount: gradeLevelFees.amount,
      },
      academicYears: academicYears.academic_year,
      strand: strands.strand_name,
      grade_level: gradeLevel.grade_level_name,
      section: sections.section_name,
    })
    .from(assessments)
    .leftJoin(students, eq(students.id, assessments.student_id))
    .leftJoin(enrollments, eq(enrollments.id, assessments.enrollment_id))
    .leftJoin(assessmentFees, eq(assessmentFees.assessment_id, assessments.id))
    .leftJoin(fees, eq(fees.id, assessmentFees.fee_id))

    .leftJoin(
      gradeLevelFees,
      and(
        eq(gradeLevelFees.fee_id, fees.id),
        eq(gradeLevelFees.grade_level_id, enrollments.grade_level_id),
        or(
          eq(gradeLevelFees.strand_id, enrollments.strand_id),
          isNull(gradeLevelFees.strand_id),
        ),
      ),
    )

    .leftJoin(academicYears, eq(academicYears.id, enrollments.academic_year_id))
    .leftJoin(strands, eq(strands.id, enrollments.strand_id))
    .leftJoin(gradeLevel, eq(gradeLevel.id, enrollments.grade_level_id))
    .leftJoin(sections, eq(sections.id, enrollments.section_id))
    .where(inArray(assessments.id, ids));

  const formattedRows = rows.map((row) => ({
    ...row.assessment,
    enrollment: row.enrollment,
    student: row.student,
    academic_year: row.academicYears,
    strand: row.strand,
    grade_level: row.grade_level,
    section: row.section,
    fees: row.fee?.id ? [{ ...row.fee }] : [],
  }));

  const resultData: Record<number, any> = {};
  formattedRows.forEach((item) => {
    if (!resultData[item.id]) {
      resultData[item.id] = { ...item, fees: [] };
    }
    if (item.fees && item.fees.length > 0) {
      resultData[item.id].fees.push(item.fees[0]);
    }
  });

  return {
    success: true,
    data: Object.values(resultData),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
});
