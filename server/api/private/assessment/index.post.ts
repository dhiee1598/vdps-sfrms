import db from "~~/server/db";
import { assessmentFees } from "~~/server/db/schema/assessment-fees-schema";
import { gradeLevelFees } from "~~/server/db/schema/grade-level-fees-schema";
import { fees } from "~~/server/db/schema/fees-schema";
import { gradeLevel } from "~~/server/db/schema/grade-level-schema";
import { assessmentSchema } from "~~/server/lib/zod-schema";
import { and, eq, inArray } from "drizzle-orm";
import { assessments } from "~~/server/db/schema/asesssment-schema";
import { enrollments } from "~~/server/db/schema/enrollment-schema";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  const body = await readValidatedBody(event, assessmentSchema.safeParse);

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Invalid data provided.",
      data: body.error.issues,
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
      statusMessage: "Conflict",
      message: "Student is already assessed for this enrollment.",
    });
  }

  const [enrollmentData] = await db
    .select({
      grade_level: gradeLevel.grade_level_name,
    })
    .from(enrollments)
    .innerJoin(gradeLevel, eq(enrollments.grade_level_id, gradeLevel.id))
    .where(eq(enrollments.id, Number(body.data.enrollment_id)));

  if (!enrollmentData) {
    throw createError({
      statusCode: 404,
      message: "Enrollment record not found.",
    });
  }

  const gName = enrollmentData.grade_level.toUpperCase();
  const jhsGrades = ["GRADE 7", "GRADE 8", "GRADE 9", "GRADE 10"];
  const isJHS = jhsGrades.includes(gName);
  const isSHS = ["GRADE 11", "GRADE 12"].includes(gName);

  const inputGradeLevelFeeIds = body.data.fees.map((f: any) => f.id);

  const dbFees = await db
    .select({
      gradeLevelFeeId: gradeLevelFees.id,
      genericFeeId: fees.id,
      amount: gradeLevelFees.amount,
      name: fees.fee_name,
    })
    .from(gradeLevelFees)
    .innerJoin(fees, eq(gradeLevelFees.fee_id, fees.id))
    .where(inArray(gradeLevelFees.id, inputGradeLevelFeeIds));

  let calculatedSubtotal = 0;

  for (const fee of dbFees) {
    let amount = Number(fee.amount);

    if (body.data.is_cash_discount && fee.name === "Tuition Fee") {
      amount = amount * 0.96;
    }

    if (isSHS && body.data.is_esc_grant && fee.name === "Tuition Fee") {
      amount = 0;
    }

    calculatedSubtotal += amount;
  }

  if (isJHS && body.data.is_esc_grant) {
    calculatedSubtotal -= 9000;
  }

  const finalCurrentFees = Math.ceil(Math.max(0, calculatedSubtotal));

  const totalAmountDue = finalCurrentFees;

  const result = await db.transaction(async (tx) => {
    const [newAssessment] = await tx
      .insert(assessments)
      .values({
        enrollment_id: Number(body.data.enrollment_id),
        student_id: body.data.student_id,
        total_amount_due: String(totalAmountDue.toFixed(2)),
        is_esc_grant: body.data.is_esc_grant,
        is_cash_discount: body.data.is_cash_discount,
      })
      .$returningId();

    if (dbFees.length > 0) {
      await tx.insert(assessmentFees).values(
        dbFees.map((fee) => ({
          assessment_id: newAssessment.id,
          fee_id: fee.genericFeeId,
        })),
      );
    }
    return newAssessment;
  });

  event.context.io.emit("newData", "A new assessment has been added.");

  return {
    success: true,
    message: "Student successfully assessed",
    totalDue: totalAmountDue,
    data: result,
  };
});
