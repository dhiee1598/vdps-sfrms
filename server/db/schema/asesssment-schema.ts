import { decimal, int, mysqlTable, timestamp, varchar } from 'drizzle-orm/mysql-core';
import { createSelectSchema } from 'drizzle-zod';

export const assessments = mysqlTable('assessments', {
  id: int('id').autoincrement().primaryKey(),
  enrollment_id: int('enrollment_id').notNull(),
  student_id: varchar({ length: 255 }).notNull(),
  total_amount_due: decimal('total_amount_due', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp().defaultNow(),
});

export const assessmentSelectSchema = createSelectSchema(assessments);
