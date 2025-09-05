import { decimal, int, mysqlEnum, mysqlTable, timestamp, varchar } from 'drizzle-orm/mysql-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

const payments = mysqlTable('payments', {
  id: int('id').autoincrement().primaryKey(),
  transaction_id: varchar('transaction_id', { length: 36 }).notNull(),
  assessment_id: int('assessment_id').notNull(),
  student_id: varchar('student_id', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  payment_type: varchar('payment_type', { length: 255 }).notNull(),
  // status: mysqlEnum('status', ['pending', 'paid', 'expired']).notNull().default('pending'),
  date_paid: timestamp('date_paid'),
  createdAt: timestamp('created_at').defaultNow(),
});

const paymentsInsertSchema = createInsertSchema(payments).omit({
  id: true,
  date_paid: true,
  createdAt: true,
}).extend({
  amount: z.coerce.number().transform(v => v.toFixed(2)),
  // 👆 Accepts number, outputs string like "11300.00"
});

export { payments, paymentsInsertSchema };
