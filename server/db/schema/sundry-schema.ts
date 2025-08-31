import { decimal, int, mysqlTable, text, timestamp, varchar } from 'drizzle-orm/mysql-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

import { feeTypes } from './fee-type-schema';

const sundries = mysqlTable('sundries', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(), // e.g., "Laboratory Fee"
  description: text('description'), // optional description
  typeId: int('type_id').references(() => feeTypes.id).notNull(), // FK to fee_types
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

const sundryInsertSchema = createInsertSchema(sundries, {
  name: schema => schema.min(3), // string
  typeId: () => z.number().int().positive(), // int
  amount: () => z.coerce.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount'),
}).omit({
  id: true,
  createdAt: true,
});

export { sundries, sundryInsertSchema };
