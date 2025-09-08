import db from '~~/server/db';
import { assessments } from '~~/server/db/schema/asesssment-schema';
import { assessmentFees } from '~~/server/db/schema/assessment-fees-schema';
import { assessmentSchema } from '~~/server/lib/zod-schema';
import { and, desc, eq, sql } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, assessmentSchema.safeParse);

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Invalid data provided. Please check the required fields.',
    });
  }

  // Check if already assessed for this enrollment
  const existing = await db
    .select()
    .from(assessments)
    .where(
      and(
        eq(assessments.enrollment_id, Number(body.data.enrollment_id)),
        eq(assessments.student_id, body.data.student_id),
      ),
    );

  if (existing.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: 'Student is already assessed for this enrollment.',
    });
  }

  // Get last assessment (previous year)
  const [lastAssessment] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.student_id, body.data.student_id))
    .orderBy(desc(assessments.id))
    .limit(1);

  let outstandingBalance = 0;

  if (lastAssessment) {
    const totalDue = Number(lastAssessment.total_amount_due);
    const totalPaid = Number(lastAssessment.total_paid ?? 0);
    outstandingBalance = totalDue - totalPaid;
  }

  // Compute new total fees (including outstanding balance)
  const newTotalDue = Number(body.data.total_fees) + outstandingBalance;

  // Insert new assessment with carried balance
  const result = await db.transaction(async (tx) => {
    const [newAssessment] = await tx
      .insert(assessments)
      .values({
        enrollment_id: Number(body.data.enrollment_id),
        student_id: body.data.student_id,
        total_amount_due: String(newTotalDue.toFixed(2)),
        total_paid: '0.00', // new assessment starts unpaid
      })
      .$returningId();

    if (body.data.fees.length > 0) {
      await tx.insert(assessmentFees).values(
        body.data.fees.map((fee: any) => ({
          assessment_id: newAssessment.id,
          fee_id: fee.id,
        })),
      );
    }

    return newAssessment;
  });

  event.context.io.emit(
    'newStudentAssessment',
    'A new student assessment has been inserted.',
  );

  return {
    success: true,
    message: 'Student successfully assessed',
    carriedBalance: outstandingBalance,
    totalDue: newTotalDue,
    data: result,
  };
});
