import { decimal, int, mysqlTable, timestamp, varchar } from 'drizzle-orm/mysql-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

const fees = mysqlTable('fees', {
  id: int('id').autoincrement().primaryKey(),
  fee_name: varchar('fee_name', { length: 100 }).notNull(),
  fee_description: varchar('fee_description', { length: 255 }),
  fee_amount: decimal('fee_amount', { precision: 10, scale: 2 }).notNull(), // e.g., "School Supply", "Internship Fee"
  createdAt: timestamp('created_at').defaultNow(),
});

const feesInsertSchema = createInsertSchema(fees, {
  fee_name: schema => schema.min(3),
  fee_description: schema => schema.optional(),
  fee_amount: () => z.coerce.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount'),
}).omit({
  id: true,
  createdAt: true,
});

export { fees, feesInsertSchema };
