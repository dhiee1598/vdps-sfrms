import db from '~~/server/db';
import { assessments } from '~~/server/db/schema/asesssment-schema';
import { assessmentFees } from '~~/server/db/schema/assessment-fees-schema';
import { assessmentSchema } from '~~/server/lib/zod-schema';
import { and, eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, assessmentSchema.safeParse);

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Invalid data provided. Please check the required fields.',
    });
  }

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

  const result = await db.transaction(async (tx) => {
    const [newAssessment] = await tx
      .insert(assessments)
      .values({
        enrollment_id: Number(body.data.enrollment_id),
        student_id: body.data.student_id,
        total_amount_due: String(body.data.total_fees),
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

  event.context.io.emit('newStudentAssessment', 'A new student assessment has been inserted.');

  return {
    success: true,
    message: 'Student successfully assessed',
    data: result,
  };
});
