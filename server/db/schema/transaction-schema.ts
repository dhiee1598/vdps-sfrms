import { sql } from 'drizzle-orm';
import { decimal, int, mysqlEnum, mysqlTable, timestamp, varchar } from 'drizzle-orm/mysql-core';
import { createInsertSchema } from 'drizzle-zod';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const transactions = mysqlTable('transactions', {
  transaction_id: varchar('transaction_id', { length: 36 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  assessment_id: int('assessment_id').notNull(),
  student_id: varchar('student_id', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  //   payment_type: varchar('payment_type', { length: 255 }).notNull(),
  status: mysqlEnum('status', ['pending', 'paid', 'expired']).notNull().default('pending'),
  date_paid: timestamp('date_paid'),
  createdAt: timestamp('created_at').defaultNow(),
});

const transactionsInsertSchema = createInsertSchema(transactions).omit({
  transaction_id: true, // ✅ don't accept from client; Drizzle generates it
  date_paid: true,
  createdAt: true,
}).extend({
  // keep amount normalized to 2 decimals; DB stores DECIMAL(10,2)
  amount: z.coerce.number().transform(v => Number(v.toFixed(2))),
});

export { transactions, transactionsInsertSchema };
