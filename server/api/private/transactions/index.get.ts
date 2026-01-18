import db from '~~/server/db';
import { academicYears } from '~~/server/db/schema/academic-years-schema';
import { enrollments } from '~~/server/db/schema/enrollment-schema';
import { gradeLevel } from '~~/server/db/schema/grade-level-schema';
import { strands } from '~~/server/db/schema/strands-schema';
import { students } from '~~/server/db/schema/student-schema';
import { transaction_items } from '~~/server/db/schema/transaction-items-schema';
import { transactions } from '~~/server/db/schema/transaction-schema';
import { assessments } from '~~/server/db/schema/asesssment-schema';
import { desc, eq, and, or, like, gte, lte, sql, inArray } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  // Pagination & Filters
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 10;
  const search = (query.search as string) || "";
  const startDate = query.startDate as string;
  const endDate = query.endDate as string;
  const status = query.status as string; // 'paid', 'pending', or undefined (all)
  const filterGrade = query.gradeLevel as string;
  const filterStrand = query.strand as string;
  const offset = (page - 1) * pageSize;

  const conditions = [];

  // Status Filter
  if (status) {
    conditions.push(eq(transactions.status, status as "paid" | "pending"));
  }

  // Search
  if (search) {
    conditions.push(or(
      like(transactions.transaction_id, `%${search}%`),
      like(students.id, `%${search}%`),
      like(students.first_name, `%${search}%`),
      like(students.last_name, `%${search}%`)
    ));
  }

  // Date Filter
  if (startDate) {
    conditions.push(gte(transactions.date_paid, new Date(startDate)));
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(transactions.date_paid, end));
  }

  // Grade & Strand Filters
  if (filterGrade) {
    conditions.push(eq(gradeLevel.grade_level_name, filterGrade));
  }
  if (filterStrand) {
    conditions.push(eq(strands.strand_name, filterStrand));
  }

  // 1. Get IDs and Count
  const baseQuery = db
    .select({ id: transactions.transaction_id })
    .from(transactions)
    .leftJoin(students, eq(transactions.student_id, students.id))
    .leftJoin(assessments, eq(transactions.assessment_id, assessments.id))
    .leftJoin(enrollments, eq(assessments.enrollment_id, enrollments.id))
    .leftJoin(gradeLevel, eq(enrollments.grade_level_id, gradeLevel.id))
    .leftJoin(strands, eq(enrollments.strand_id, strands.id))
    .where(and(...conditions));

  const totalCountResult = await db
    .select({ count: sql<number>`count(distinct ${transactions.transaction_id})` })
    .from(transactions)
    .leftJoin(students, eq(transactions.student_id, students.id))
    .leftJoin(assessments, eq(transactions.assessment_id, assessments.id))
    .leftJoin(enrollments, eq(assessments.enrollment_id, enrollments.id))
    .leftJoin(gradeLevel, eq(enrollments.grade_level_id, gradeLevel.id))
    .leftJoin(strands, eq(enrollments.strand_id, strands.id))
    .where(and(...conditions));

  const total = Number(totalCountResult[0]?.count || 0);

  const orderCol = status === 'pending' ? transactions.createdAt : transactions.date_paid;
  
  const pagedIds = await baseQuery
    .limit(pageSize)
    .offset(offset)
    .orderBy(desc(orderCol || transactions.createdAt));

  const ids = pagedIds.map(r => r.id);

  if (ids.length === 0) {
    return {
      message: 'No transactions found',
      data: [],
      total,
      page,
      pageSize,
      totalPages: 0
    };
  }

  // 2. Fetch Details
  const rows = await db
    .select({
      transaction: transactions,
      student: students,
      item: transaction_items,
      enrollment: enrollments,
      academic_year: academicYears,
      grade_level: gradeLevel,
      strand: strands,
    })
    .from(transactions)
    .leftJoin(
      transaction_items,
      eq(transactions.transaction_id, transaction_items.transaction_id),
    )
    .leftJoin(students, eq(transactions.student_id, students.id))
    .leftJoin(assessments, eq(transactions.assessment_id, assessments.id))
    .leftJoin(enrollments, eq(assessments.enrollment_id, enrollments.id))
    .leftJoin(
      academicYears,
      eq(enrollments.academic_year_id, academicYears.id),
    )
    .leftJoin(
      gradeLevel,
      eq(enrollments.grade_level_id, gradeLevel.id),
    )
    .leftJoin(
      strands,
      eq(enrollments.strand_id, strands.id),
    )
    .where(inArray(transactions.transaction_id, ids))
    .orderBy(desc(orderCol || transactions.createdAt));

  // ✅ Group by transaction_id
  const grouped = rows.reduce((acc: any[], row) => {
    const { transaction, student, item, enrollment, ...rest } = row;
    let existing = acc.find(
      (t: any) => t.transaction.transaction_id === transaction.transaction_id,
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
      const alreadyExists = existing.transaction_items.some(
        (t: any) => t.id === item.id,
      );

      if (!alreadyExists) {
        existing.transaction_items.push(item);
      }
    }

    return acc;
  }, []);

  return {
    message: 'Fetch All transactions',
    data: grouped,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
});
