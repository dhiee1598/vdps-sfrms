import { sql } from 'drizzle-orm';
import { int, mysqlEnum, mysqlTable, timestamp, varchar } from 'drizzle-orm/mysql-core';

const payments = mysqlTable('payments', {
  id: int('id').autoincrement().primaryKey(),
  assessment_id: varchar('assessment_id', { length: 255 }).notNull(),
  student_id: varchar('student_id', { length: 255 }).notNull(),
  amount: varchar('amount', { length: 255 }).notNull(),
  expires_at: timestamp('expires_at').notNull().default(sql`DATE_ADD(NOW(), INTERVAL 1 DAY)`), // auto-expire
  status: mysqlEnum('status', ['pending', 'paid', 'expired']).notNull().default('pending'),
  date_paid: timestamp('date_paid'), // set only when status = 'paid'
  createdAt: timestamp('created_at').defaultNow(),
});

export { payments };
