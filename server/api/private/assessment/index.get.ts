import db from '~~/server/db';
import { academicYears } from '~~/server/db/schema/academic-years-schema';
import { assessments, assessmentSelectSchema } from '~~/server/db/schema/asesssment-schema';
import { assessmentFees } from '~~/server/db/schema/assessment-fees-schema';
import { enrollments, enrollmentSelectSchema } from '~~/server/db/schema/enrollment-schema';
import { fees } from '~~/server/db/schema/fees-schema';
import { semesters } from '~~/server/db/schema/semester-schema';
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

  const rows = await db
    .select({
      assessment: assessments,
      enrollment: enrollments,
      student: students,
      fee: fees,
      transactions,
      transactions_item: transaction_items,
    })
    .from(assessments)
    .leftJoin(students, eq(assessments.student_id, students.id))
    .leftJoin(enrollments, eq(assessments.enrollment_id, enrollments.id))
    .leftJoin(assessmentFees, eq(assessments.id, assessmentFees.assessment_id))
    .leftJoin(fees, eq(assessmentFees.id, fees.id))
    .leftJoin(transactions, eq(assessments.id, transactions.assessment_id))
    .leftJoin(transaction_items, eq(transactions.transaction_id, transaction_items.transaction_id))
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
          totalPaid: 0,
          balance: a.total_amount_due || 0,
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
          }
        }

        if (row.transactions.status === 'paid') {
          const normalized = normalizeItem(row.transactions_item?.item_type || '');

          if (normalized) {
            const amt = Number(row.transactions_item?.amount) || 0;
            acc[a.id].totalPaid += amt;
            acc[a.id].balance -= amt;
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
