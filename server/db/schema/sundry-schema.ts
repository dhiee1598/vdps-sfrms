import { decimal, int, mysqlTable, text, timestamp, varchar } from 'drizzle-orm/mysql-core';

import { feeTypes } from './fee-type-schema';

export const sundries = mysqlTable('sundries', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(), // e.g., "Laboratory Fee"
  description: text('description'), // optional description
  typeId: int('type_id').references(() => feeTypes.id).notNull(), // FK to fee_types
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
