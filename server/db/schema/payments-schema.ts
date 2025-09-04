import { int, mysqlEnum, mysqlTable, timestamp, varchar } from 'drizzle-orm/mysql-core';

const payments = mysqlTable('payments', {
  id: int('id').autoincrement().primaryKey(),
  assessment_id: varchar('assessment_id', { length: 255 }).notNull(),
  student_id: varchar('student_id', { length: 255 }).notNull(),
  amount: varchar('amount', { length: 255 }).notNull(),
  status: mysqlEnum('status', ['pending', 'paid', 'expired']).notNull().default('pending'),
  date_paid: timestamp('date_paid'),
  createdAt: timestamp('created_at').defaultNow(),
});

export { payments };
