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
  const rows = await db.select({
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

  const results = rows.reduce<Record<number, { assessment: Assessment; transaction: (Transactions & { transaction_item: TransactionItems[] })[] }>>(
    (acc, row) => {
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
    },
    {},
  );

  for (const [id, { transaction }] of Object.entries(results)) {
    const fullPaymentTx = transaction.find(
      t =>
        t.status === 'paid'
        && t.transaction_item?.some(i => i.item_type === 'Full Payment'),
    );

    if (fullPaymentTx) {
      results[Number(id)].transaction = [fullPaymentTx];

      throw createError({
        statusCode: 409,
        statusMessage: 'Conflict',
        message: 'This assessment is already fully paid.',
      });
    }
  }

  await db
    .update(transactions)
    .set({
      status: body.status,
      date_paid: new Date(),
    })
    .where(eq(transactions.transaction_id, id))
    .execute();

  return { success: true, message: 'Transaction updated successfully' };
});
