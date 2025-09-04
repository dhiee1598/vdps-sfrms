import { decimal, int, mysqlTable } from 'drizzle-orm/mysql-core';

export const assessmentFees = mysqlTable('assessmentFees', {
  assessment_id: int('assessment_id').primaryKey().notNull(),
  fee_id: int('fee_id').primaryKey().notNull(),
  applied_amount: decimal('applied_amount', { precision: 10, scale: 2 }).notNull(),
});
