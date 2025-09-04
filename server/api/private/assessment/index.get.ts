import db from '~~/server/db';
import { academicYears } from '~~/server/db/schema/academic-years-schema';
import { assessments, assessmentSelectSchema } from '~~/server/db/schema/asesssment-schema';
import { assessmentFees } from '~~/server/db/schema/assessment-fees-schema';
import { enrollments, enrollmentSelectSchema } from '~~/server/db/schema/enrollment-schema';
import { fees } from '~~/server/db/schema/fees-schema';
import { payments } from '~~/server/db/schema/payments-schema';
import { semesters } from '~~/server/db/schema/semester-schema';
import { students, studentSelectSchema } from '~~/server/db/schema/student-schema';
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
      payment: payments,
    })
    .from(assessments)
    .leftJoin(enrollments, eq(enrollments.id, assessments.enrollment_id))
    .leftJoin(students, eq(students.id, assessments.student_id))
    .leftJoin(assessmentFees, eq(assessmentFees.assessment_id, assessments.id))
    .leftJoin(fees, eq(fees.id, assessmentFees.fee_id))
    .leftJoin(payments, eq(payments.assessment_id, assessments.id))
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
          payments: [],
        };
      }

      if (row.fee?.id) {
        acc[a.id].fees.push(row.fee);
      }

      if (row.payment?.assessment_id) {
        acc[a.id].payments.push(row.payment);

        if (row.payment.status === 'paid') {
          const amt = Number(row.payment.amount) || 0;
          acc[a.id].totalPaid += amt;
          acc[a.id].balance -= amt;
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
