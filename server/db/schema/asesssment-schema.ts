// import { decimal, int, mysqlTable, timestamp, varchar } from 'drizzle-orm/mysql-core';
// import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
// import z from 'zod';

// export const assessments = mysqlTable('assessments', {
//   id: int().primaryKey().autoincrement(),
//   enrollment_id: int().notNull(),
//   student_id: varchar({ length: 255 }).notNull(),
//   total_amount_due: decimal('total_amount_due', { precision: 10, scale: 2 }).notNull(),
//   createdAt: timestamp().defaultNow(),
// });

// export const assessmentInsertSchema = createInsertSchema({
//   ...assessments,
//   total_amount_due: z.coerce.number().transform(v => Number(v.toFixed(2))),
// }).omit({
//   id: true,
//   createdAt: true,
// });

// export const assessmentSelectSchema = createSelectSchema(assessments);

import { decimal, int, mysqlTable, timestamp, varchar } from 'drizzle-orm/mysql-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const assessments = mysqlTable('assessments', {
  id: int('id').primaryKey().autoincrement(),
  enrollment_id: int('enrollment_id').notNull(),
  student_id: varchar('student_id', { length: 255 }).notNull(),
  total_amount_due: decimal('total_amount_due', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp().defaultNow(),
});

// ✅ Pass table directly, override only specific columns
export const assessmentInsertSchema = createInsertSchema(assessments, {
  total_amount_due: () =>
    z.coerce.number().transform(v => Number(v.toFixed(2))), // handle decimal correctly
}).omit({
  id: true,
  createdAt: true,
});

export const assessmentSelectSchema = createSelectSchema(assessments);
