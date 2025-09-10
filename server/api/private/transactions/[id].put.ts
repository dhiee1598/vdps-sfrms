import db from '~~/server/db';
import { academicYears } from '~~/server/db/schema/academic-years-schema';
import { assessments } from '~~/server/db/schema/asesssment-schema';
import { enrollments } from '~~/server/db/schema/enrollment-schema';
import { semesters } from '~~/server/db/schema/semester-schema';
import { transaction_items } from '~~/server/db/schema/transaction-items-schema';
import { transactions } from '~~/server/db/schema/transaction-schema';
import { and, eq } from 'drizzle-orm';

type Assessment = typeof assessments.$inferSelect;
type Transactions = typeof transactions.$inferSelect;
type TransactionItems = typeof transaction_items.$inferSelect;

export default defineEventHandler(async (event) => {
  const id = String(event.context.params?.id);
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID is required',
      message: 'ID is required',
    });
  }

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

  const body = await readBody(event);

  // First Get The Assessment and all transactions
  const rows = await db
    .select({
      assessment: assessments,
      transaction: transactions,
      enroll: enrollments,
      transaction_item: transaction_items,
    })
    .from(assessments)
    .leftJoin(enrollments, eq(enrollments.id, assessments.enrollment_id))
    .leftJoin(transactions, eq(transactions.assessment_id, assessments.id))
    .leftJoin(transaction_items, eq(transaction_items.transaction_id, transactions.transaction_id))
    .where(and(...conditions, eq(assessments.student_id, body.student_id)));

  const results = rows.reduce<
    Record<
      number,
      { assessment: Assessment; transaction: (Transactions & { transaction_item: TransactionItems[] })[] }
    >
  >((acc, row) => {
    const assessment = row.assessment;
    const transaction = row.transaction;
    const item = row.transaction_item;

    if (!acc[assessment.id]) {
      acc[assessment.id] = { assessment, transaction: [] };
    }

    if (!transaction)
      return acc;

    let existingTx = acc[assessment.id].transaction.find(
      t => t.transaction_id === transaction.transaction_id,
    );

    if (!existingTx) {
      existingTx = { ...transaction, transaction_item: [] };
      acc[assessment.id].transaction.push(existingTx);
    }

    if (item) {
      existingTx.transaction_item.push(item);
    }

    return acc;
  }, {});

  let targetAssessmentId: number | null = null;

  for (const [assessmentId, { transaction }] of Object.entries(results)) {
    const txToUpdate = transaction.find(t => String(t.transaction_id) === String(id));

    if (!txToUpdate)
      continue;

    const tuitionItems = [
      'Downpayment',
      '1st Quarter',
      '2nd Quarter',
      '3rd Quarter',
      '4th Quarter',
      'Full Payment',
    ];
    const hasTuitionItem = txToUpdate.transaction_item?.some(i =>
      tuitionItems.includes(i.item_type),
    );

    if (!hasTuitionItem) {
      continue;
    }

    const fullPaymentTx = transaction.find(
      t =>
        t.status === 'paid'
        && t.transaction_item?.some(i => i.item_type === 'Full Payment'),
    );

    if (fullPaymentTx) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Conflict',
        message: 'This assessment is already fully paid.',
      });
    }

    targetAssessmentId = Number(assessmentId);
  }

  if (!targetAssessmentId) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'No matching assessment found for this transaction.',
    });
  }

  // Update transaction first
  await db
    .update(transactions)
    .set({
      status: body.status,
      date_paid: new Date(),
    })
    .where(eq(transactions.transaction_id, id))
    .execute();

  // Recompute total_paid for the assessment
  const paidRows = await db
    .select({
      transaction: transactions,
      transaction_item: transaction_items,
    })
    .from(transactions)
    .leftJoin(
      transaction_items,
      eq(transaction_items.transaction_id, transactions.transaction_id),
    )
    .where(and(eq(transactions.assessment_id, targetAssessmentId), eq(transactions.status, 'paid')));

  const tuitionItems = [
    'Downpayment',
    '1st Quarter',
    '2nd Quarter',
    '3rd Quarter',
    '4th Quarter',
    'Full Payment',
  ];

  const totalPaid = paidRows
    .map(r => r.transaction_item)
    .filter((i): i is TransactionItems => !!i && tuitionItems.includes(i.item_type))
    .reduce((sum, i) => sum + Number(i.amount ?? 0), 0);

  // Update the assessment record
  await db
    .update(assessments)
    .set({
      total_paid: String(totalPaid),
    })
    .where(eq(assessments.id, targetAssessmentId))
    .execute();

  event.context.io.emit('newData', 'A new transaction has been updated.');

  return { success: true, message: 'Transaction & assessment updated successfully' };
});
