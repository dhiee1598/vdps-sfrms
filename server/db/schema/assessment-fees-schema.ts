import { int, mysqlTable } from 'drizzle-orm/mysql-core';

export const assessmentFees = mysqlTable('assessmentFees', {
  id: int().primaryKey().autoincrement(),
  assessment_id: int('assessment_id').notNull(),
  fee_id: int('fee_id').notNull(),
});
