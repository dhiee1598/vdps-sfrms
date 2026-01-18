import db from "~~/server/db";
import { academicYears } from "~~/server/db/schema/academic-years-schema";
import { assessmentFees } from "~~/server/db/schema/assessment-fees-schema";
import {
  enrollments,
  enrollmentSelectSchema,
} from "~~/server/db/schema/enrollment-schema";
import { fees } from "~~/server/db/schema/fees-schema";
import { gradeLevel } from "~~/server/db/schema/grade-level-schema";
import { sections } from "~~/server/db/schema/section-schema";
import { strands } from "~~/server/db/schema/strands-schema";
import {
  students,
  studentSelectSchema,
} from "~~/server/db/schema/student-schema";
import { transaction_items } from "~~/server/db/schema/transaction-items-schema";
import { transactions } from "~~/server/db/schema/transaction-schema";
import { and, eq, or, isNull, like, sql, inArray, desc } from "drizzle-orm";
import z from "zod";
import { gradeLevelFees } from "~~/server/db/schema/grade-level-fees-schema";
import {
  assessments,
  assessmentSelectSchema,
} from "~~/server/db/schema/asesssment-schema";

export const studentEnrolledAssessment = z.object({
  student: studentSelectSchema.nullable(),
  enrollment: enrollmentSelectSchema.nullable(),
  assessment: assessmentSelectSchema.nullable(),
});

export default defineEventHandler(async (_event) => {
  const query = getQuery(_event);
  const conditions = [];

  // Pagination & Search
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 8;
  const search = (query.search as string) || "";
  const offset = (page - 1) * pageSize;

  if (query.allAssessments === "true") {
    // Fetch all history
  } else {
    // Default: Active Year Only
    const [activeYear] = await db
      .select()
      .from(academicYears)
      .where(eq(academicYears.status, true));

    if (activeYear) {
      conditions.push(eq(enrollments.academic_year_id, activeYear.id));
    }
  }

  // Search Filter
  if (search) {
    conditions.push(
      or(
        like(students.first_name, `%${search}%`),
        like(students.last_name, `%${search}%`),
        like(students.middle_name, `%${search}%`),
        like(students.id, `%${search}%`),
      ),
    );
  }

  // 1. Get Total Count & Paginated IDs
  // We need to join students and enrollments here to filter by search and active year
  const baseQuery = db
    .select({ id: assessments.id })
    .from(assessments)
    .leftJoin(students, eq(students.id, assessments.student_id))
    .leftJoin(enrollments, eq(enrollments.id, assessments.enrollment_id))
    .where(and(...conditions));

  const totalCountResult = await db
    .select({ count: sql<number>`count(distinct ${assessments.id})` })
    .from(assessments)
    .leftJoin(students, eq(students.id, assessments.student_id))
    .leftJoin(enrollments, eq(enrollments.id, assessments.enrollment_id))
    .where(and(...conditions));

  const total = Number(totalCountResult[0]?.count || 0);

  const pagedIds = await baseQuery
    .limit(pageSize)
    .offset(offset)
    .orderBy(desc(assessments.id)); // Order by ID or createdAt if available

  const ids = pagedIds.map((r) => r.id);

  if (ids.length === 0) {
    return {
      success: true,
      data: [],
      total,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  // 2. Fetch Details for these IDs
  const rows = await db
    .select({
      assessment: assessments,
      enrollment: enrollments,
      student: students,
      assessmentFees,
      fee: {
        id: fees.id,
        fee_name: fees.fee_name,
        fee_description: fees.fee_description,
        amount: gradeLevelFees.amount,
      },
      transactions,
      transactions_item: transaction_items,
      academicYears: academicYears.academic_year,
      strand: strands.strand_name,
      grade_level: gradeLevel.grade_level_name,
      section: sections.section_name,
    })
    .from(assessments)
    .leftJoin(students, eq(students.id, assessments.student_id))
    .leftJoin(enrollments, eq(enrollments.id, assessments.enrollment_id))
    .leftJoin(assessmentFees, eq(assessmentFees.assessment_id, assessments.id))
    .leftJoin(fees, eq(fees.id, assessmentFees.fee_id))

    .leftJoin(
      gradeLevelFees,
      and(
        eq(gradeLevelFees.fee_id, fees.id),
        eq(gradeLevelFees.grade_level_id, enrollments.grade_level_id),
        or(
          eq(gradeLevelFees.strand_id, enrollments.strand_id),
          isNull(gradeLevelFees.strand_id),
        ),
      ),
    )

    .leftJoin(transactions, eq(transactions.assessment_id, assessments.id))
    .leftJoin(
      transaction_items,
      eq(transaction_items.transaction_id, transactions.transaction_id),
    )
    .leftJoin(academicYears, eq(academicYears.id, enrollments.academic_year_id))
    .leftJoin(strands, eq(strands.id, enrollments.strand_id))
    .leftJoin(gradeLevel, eq(gradeLevel.id, enrollments.grade_level_id))
    .leftJoin(sections, eq(sections.id, enrollments.section_id))
    .where(inArray(assessments.id, ids));

  const TUITION_KEYWORDS = [
    "Full Payment", "Downpayment", "Down Payment", "DP", 
    "Partial Payment", "Partial", "Tuition", "Tuition Fee", 
    "Upon Enrollment", "Reservation Fee", "RF", 
    "1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"
  ];

  const ALL_MONTHS = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const groupedMap = rows.reduce(
    (acc, row) => {
      const a = row.assessment;

      if (!acc[a.id]) {
        acc[a.id] = {
          ...a,
          enrollment: row.enrollment,
          student: row.student,
          fees: [],
          transactions: [],
          transaction_items: [],

          // Initialize custom tracking
          calculatedTotalPaid: 0,
          
          academic_year: row.academicYears,
          strand: row.strand,
          grade_level: row.grade_level,
          section: row.section,
        };
      }

      // 1. Process Fees
      if (row.fee?.id) {
        const alreadyExists = acc[a.id].fees.some(
          (f: any) => f.id === row.fee!.id,
        );
        if (!alreadyExists) {
          acc[a.id].fees.push(row.fee);
        }
      }

      // 2. Process Transactions & Items
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
          const item = row.transactions_item;
          const alreadyExists = transaction.items.some(
            (i: any) => i.id === item.id,
          );

          if (!alreadyExists) {
            transaction.items.push(item);

            // 3. On-the-fly Calculation: Only sum Tuition items from PAID transactions
            if (row.transactions.status === 'paid') {
              const type = item.item_type;
              const isMonth = ALL_MONTHS.includes(type);
              const isKeyword = TUITION_KEYWORDS.some(k => type.toLowerCase() === k.toLowerCase());
              const isTuitionLike = type.toLowerCase().includes('tuition');

              if (isMonth || isKeyword || isTuitionLike) {
                acc[a.id].calculatedTotalPaid += Number(item.amount || 0);
              }
            }
          }
        }
      }

      return acc;
    },
    {} as Record<number, any>,
  );

  // Finalize totals
  const grouped = Object.values(groupedMap).map((assessment: any) => {
    const totalDue = Number(assessment.total_amount_due) || 0;
    const totalPaid = assessment.calculatedTotalPaid; // Use our calculated value
    const balance = Math.max(0, totalDue - totalPaid);

    return {
      ...assessment,
      total_paid: totalPaid.toFixed(2), // Overwrite DB value with corrected sum
      totalPaid: totalPaid.toFixed(2), // Legacy/Helper property
      balance: balance.toFixed(2),
    };
  });

  return {
    success: true,
    data: grouped,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
});
