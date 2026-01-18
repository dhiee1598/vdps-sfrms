import db from "~~/server/db";
import { assessmentFees } from "~~/server/db/schema/assessment-fees-schema";
import { gradeLevelFees } from "~~/server/db/schema/grade-level-fees-schema";
import { fees } from "~~/server/db/schema/fees-schema";
import { enrollments } from "~~/server/db/schema/enrollment-schema";
import { gradeLevel } from "~~/server/db/schema/grade-level-schema";
import { assessmentSchema } from "~~/server/lib/zod-schema";
import { and, desc, eq, inArray, isNull, gt } from "drizzle-orm";
import { assessments } from "~~/server/db/schema/asesssment-schema";
import { transactions } from "~~/server/db/schema/transaction-schema";
import { transaction_items } from "~~/server/db/schema/transaction-items-schema"; // ✅ Import Items

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

  // 1. Check for Duplicate Assessment
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

  // 2. Fetch Enrollment & Grade Level
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

  // 3. FETCH FEES
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

  // 4. Perform Server-Side Calculation
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

  // 5. Get Outstanding Balance (From Previous Years)
  const [lastAssessment] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.student_id, body.data.student_id))
    .orderBy(desc(assessments.id))
    .limit(1);

  let outstandingBalance = 0;
  if (lastAssessment) {
    const prevDue = Number(lastAssessment.total_amount_due);
    const prevPaid = Number(lastAssessment.total_paid ?? 0);

    // do not reduce the new assessment amount.
    outstandingBalance = Math.max(0, prevDue - prevPaid);
  }

  const totalAmountDue = finalCurrentFees + outstandingBalance;
  // 6. CHECK FOR VALID "ADVANCE" PAYMENTS (Refined)
  // Logic: Find Orphan Transactions that CONTAIN a 'Reservation Fee' item.

  const advanceConditions = [
    eq(transactions.student_id, body.data.student_id),
    isNull(transactions.assessment_id), // Must be Orphan
    // Filter by Item Name (Reservation, Downpayment, etc.)
    inArray(transaction_items.item_type, [
      "Reservation Fee",
      "RF",
      "Downpayment",
      "Advance Payment",
    ]),
  ];

  // Safety: Ensure it's newer than the last assessment
  if (lastAssessment && lastAssessment.createdAt) {
    advanceConditions.push(
      gt(transactions.createdAt, lastAssessment.createdAt),
    );
  }

  const advanceTransactions = await db
    .selectDistinct({
      // Use Distinct to avoid duplicates if multiple items match
      transaction_id: transactions.transaction_id,
      total_amount: transactions.total_amount,
    })
    .from(transactions)
    // ✅ JOIN with Items to check the type
    .innerJoin(
      transaction_items,
      eq(transactions.transaction_id, transaction_items.transaction_id),
    )
    .where(and(...advanceConditions));

  const totalAdvancePaid = advanceTransactions.reduce(
    (sum, t) => sum + Number(t.total_amount || 0),
    0,
  );

  // 7. Insert into Database
  const result = await db.transaction(async (tx) => {
    // Insert Assessment
    const [newAssessment] = await tx
      .insert(assessments)
      .values({
        enrollment_id: Number(body.data.enrollment_id),
        student_id: body.data.student_id,
        total_amount_due: String(totalAmountDue.toFixed(2)),
        total_paid: String(totalAdvancePaid.toFixed(2)),
        is_esc_grant: body.data.is_esc_grant,
        is_cash_discount: body.data.is_cash_discount,
      })
      .$returningId();

    // Insert Fees
    if (dbFees.length > 0) {
      await tx.insert(assessmentFees).values(
        dbFees.map((fee) => ({
          assessment_id: newAssessment.id,
          fee_id: fee.genericFeeId,
        })),
      );
    }

    // ✅ LINK THE FOUND RESERVATION TRANSACTIONS
    if (advanceTransactions.length > 0) {
      const transactionIds = advanceTransactions.map((t) => t.transaction_id);
      await tx
        .update(transactions)
        .set({ assessment_id: newAssessment.id })
        .where(inArray(transactions.transaction_id, transactionIds));
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
