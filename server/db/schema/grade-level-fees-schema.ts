import { decimal, int, mysqlTable, timestamp } from 'drizzle-orm/mysql-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { gradeLevel } from './grade-level-schema';
import { fees } from './fees-schema';

const gradeLevelFees = mysqlTable('gradeLevelFees', {
  id: int('id').autoincrement().primaryKey(),
  grade_level_id: int('grade_level_id').notNull().references(() => gradeLevel.id),
  fee_id: int('fee_id').notNull().references(() => fees.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

const gradeLevelFeesInsertSchema = createInsertSchema(gradeLevelFees, {
  amount: () => z.coerce.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount'),
}).omit({
  id: true,
  createdAt: true,
});

export { gradeLevelFees, gradeLevelFeesInsertSchema };
