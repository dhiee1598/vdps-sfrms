import db from '~~/server/db';
import { academicYears } from '~~/server/db/schema/academic-years-schema';
import { assessments, assessmentSelectSchema } from '~~/server/db/schema/asesssment-schema';
import { assessmentFees } from '~~/server/db/schema/assessment-fees-schema';
import { enrollments, enrollmentSelectSchema } from '~~/server/db/schema/enrollment-schema';
import { fees } from '~~/server/db/schema/fees-schema';
import { gradeLevel } from '~~/server/db/schema/grade-level-schema';
import { sections } from '~~/server/db/schema/section-schema';
import { semesters } from '~~/server/db/schema/semester-schema';
import { strands } from '~~/server/db/schema/strands-schema';
import { students, studentSelectSchema } from '~~/server/db/schema/student-schema';
import { transaction_items } from '~~/server/db/schema/transaction-items-schema';
import { transactions } from '~~/server/db/schema/transaction-schema';
import { and, eq } from 'drizzle-orm';
import z from 'zod';

export const studentEnrolledAssessment = z.object({
  student: studentSelectSchema.nullable(),
  enrollment: enrollmentSelectSchema.nullable(),
  assessment: assessmentSelectSchema.nullable(),
});

export default defineEventHandler(async (_event) => {
  const query = getQuery(_event);
  const conditions = [];

  if (query.allAssessments === 'true') {
    //
  }
  else {
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
  }

  const rows = await db
    .select({
      assessment: assessments,
      enrollment: enrollments,
      student: students,
      assessmentFees,
      fee: fees,
      transactions,
      transactions_item: transaction_items,
      academicYears: academicYears.academic_year,
      semesters: semesters.semester,
      strand: strands.strand_name,
      grade_level: gradeLevel.grade_level_name,
      section: sections.section_name,
    })
    .from(assessments)
    .leftJoin(students, eq(students.id, assessments.student_id))
    .leftJoin(enrollments, eq(enrollments.id, assessments.enrollment_id))
    .leftJoin(assessmentFees, eq(assessmentFees.assessment_id, assessments.id))
    .leftJoin(fees, eq(fees.id, assessmentFees.fee_id))
    .leftJoin(transactions, eq(transactions.assessment_id, assessments.id))
    .leftJoin(transaction_items, eq(transaction_items.transaction_id, transactions.transaction_id))
    .leftJoin(academicYears, eq(academicYears.id, enrollments.academic_year_id))
    .leftJoin(semesters, eq(semesters.id, enrollments.semester_id))
    .leftJoin(strands, eq(strands.id, enrollments.strand_id))
    .leftJoin(gradeLevel, eq(gradeLevel.id, enrollments.grade_level_id))
    .leftJoin(sections, eq(sections.id, enrollments.section_id))
    .where(and(...conditions));

  const grouped = Object.values(
    rows.reduce((acc, row) => {
      const a = row.assessment;

      if (!acc[a.id]) {
        acc[a.id] = {
          ...a,
          enrollment: row.enrollment,
          student: row.student,
          fees: [],
          transactions: [],
          transaction_items: [],
          totalPaid: 0,
          balance: a.total_amount_due || 0,
          academic_year: row.academicYears,
          semester: row.semesters,
          strand: row.strand,
          grade_level: row.grade_level,
          section: row.section,
        };
      }

      if (row.fee?.id) {
        const alreadyExists = acc[a.id].fees.some((f: any) => f.id === row.fee!.id);
        if (!alreadyExists) {
          acc[a.id].fees.push(row.fee);
        }
      }

      if (row.transactions?.transaction_id) {
        let transaction = acc[a.id].transactions.find(
          (t: any) => t.transaction_id === row.transactions!.transaction_id,
        );

        if (!transaction) {
          transaction = {
            ...row.transactions,
            items: [],
          };
          acc[a.id].transactions.push(transaction);
        }

        if (row.transactions_item?.id) {
          const alreadyExists = transaction.items.some(
            (item: any) => item.id === row.transactions_item!.id,
          );

          if (!alreadyExists) {
            transaction.items.push(row.transactions_item);

            if (row.transactions.status === 'paid') {
              const normalized = normalizeItem(row.transactions_item?.item_type || '');
              if (normalized) {
                const amt = Number(row.transactions_item?.amount) || 0;
                acc[a.id].totalPaid += amt;
                acc[a.id].balance -= amt;
              }
            }
          }
        }
      }

      return acc;
    }, {} as Record<number, any>),
  );

  return {
    success: true,
    data: grouped,
  };
});
