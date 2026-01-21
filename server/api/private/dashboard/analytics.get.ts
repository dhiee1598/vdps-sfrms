import db from '~~/server/db';
import { academicYears } from '~~/server/db/schema/academic-years-schema';
import { enrollments } from '~~/server/db/schema/enrollment-schema';
import { gradeLevel } from '~~/server/db/schema/grade-level-schema';
import { strands } from '~~/server/db/schema/strands-schema';
import { transactions } from '~~/server/db/schema/transaction-schema';
import { eq, sql } from 'drizzle-orm';

export default defineEventHandler(async () => {
  // Get Active Academic Year
  const [activeYear] = await db
    .select()
    .from(academicYears)
    .where(eq(academicYears.status, true));

  if (!activeYear) {
    return {
      gradeLevelStats: [],
      strandStats: [],
      totalRevenue: 0,
    };
  }

  // 1. Enrollment by Grade Level (Filtered by Active AY)
  const gradeLevelStats = await db
    .select({
      name: gradeLevel.grade_level_name,
      count: sql<number>`count(${enrollments.id})`,
    })
    .from(enrollments)
    .leftJoin(gradeLevel, eq(enrollments.grade_level_id, gradeLevel.id))
    .where(eq(enrollments.academic_year_id, activeYear.id))
    .groupBy(gradeLevel.grade_level_name, gradeLevel.id)
    .orderBy(gradeLevel.id);

  // 2. Enrollment by Strand (Filtered by Active AY)
  const strandStats = await db
    .select({
      name: strands.strand_name,
      count: sql<number>`count(${enrollments.id})`,
    })
    .from(enrollments)
    .innerJoin(strands, eq(enrollments.strand_id, strands.id))
    .where(eq(enrollments.academic_year_id, activeYear.id))
    .groupBy(strands.strand_name);

  // 3. Total Revenue (Filtered by Active AY - strictly speaking revenue is usually per transaction date,
  // but if we want revenue *for this enrollment cycle*, we might need to link transactions to enrollments.
  // However, transactions are linked to students.
  // For now, let's keep revenue as "All Time" or "This Year's Payments" based on date?
  // User asked "change school year... student is still the same".
  // Let's filter revenue by checking if the student is enrolled in the current AY?
  // Or better, check the transaction date vs Academic Year range?
  // Since AY has no start/end dates in schema (just name), it's hard to filter transactions by date accurately without that.
  // But usually, transactions are linked to an "Assessment" (which we removed) or just a student.
  // If we assume "Total Revenue" on dashboard means "Total Revenue for CURRENT Active Year", we need a way to determine that.
  // Given we removed assessments, transactions are just "Student paid X".
  // I will leave Revenue as ALL TIME for now unless specified, or filter by transactions created *after* the AY started?
  // But we don't know when AY started.
  // Let's Stick to fixing the STUDENT stats first which was the main complaint.)

  // Wait, I can link transactions to students, and check if that student is enrolled in the active year?
  // That's imperfect (a student might pay for previous debt).
  // Let's keep Revenue as is (All Time) or maybe just don't filter it yet, as the complaint was "student is still the same".
  // "Student is still the same" strongly refers to the Enrollment Counts.

  const revenueResult = await db
    .select({
      total: sql<string>`sum(${transactions.total_amount})`,
    })
    .from(transactions)
    .where(eq(transactions.status, 'paid'));

  const totalRevenue = Number(revenueResult[0]?.total || 0);

  return {
    gradeLevelStats,
    strandStats,
    totalRevenue,
  };
});
