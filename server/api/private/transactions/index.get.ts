import db from '~~/server/db';
import { academicYears } from '~~/server/db/schema/academic-years-schema';
import { enrollments } from '~~/server/db/schema/enrollment-schema';
import { gradeLevel } from '~~/server/db/schema/grade-level-schema';
import { semesters } from '~~/server/db/schema/semester-schema';
import { strands } from '~~/server/db/schema/strands-schema';
import { students } from '~~/server/db/schema/student-schema';
import { transaction_items } from '~~/server/db/schema/transaction-items-schema';
import { transactions } from '~~/server/db/schema/transaction-schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async () => {
  const rows = await db
    .select({
      transaction: transactions,
      student: students,
      item: transaction_items,
      enrollment: enrollments,
      academic_year: academicYears,
      semester: semesters,
      grade_level: gradeLevel,
      strand: strands,
    })
    .from(transactions)
    .leftJoin(
      transaction_items,
      eq(transactions.transaction_id, transaction_items.transaction_id),
    )
    .leftJoin(students, eq(transactions.student_id, students.id))
    .leftJoin(enrollments, eq(transactions.student_id, enrollments.student_id))
    .leftJoin(
      academicYears,
      eq(enrollments.academic_year_id, academicYears.id),
    )
    .leftJoin(
      semesters,
      eq(enrollments.semester_id, semesters.id),
    )
    .leftJoin(
      gradeLevel,
      eq(enrollments.grade_level_id, gradeLevel.id),
    )
    .leftJoin(
      strands,
      eq(enrollments.strand_id, strands.id),
    );

  // ✅ Group by transaction_id
  const grouped = rows.reduce((acc: any[], row) => {
    const { transaction, student, item, enrollment, ...rest } = row;
    let existing = acc.find(
      t => t.transaction.transaction_id === transaction.transaction_id,
    );

    if (!existing) {
      existing = {
        transaction,
        student,
        enrollment,
        transaction_items: [],
        ...rest,
      };
      acc.push(existing);
    }

    if (item) {
      existing.transaction_items.push(item);
    }

    return acc;
  }, []);

  return {
    message: 'Fetch All transactions',
    data: grouped,
  };
});
