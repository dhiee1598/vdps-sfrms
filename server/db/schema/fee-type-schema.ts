import { int, mysqlTable, timestamp, varchar } from 'drizzle-orm/mysql-core';
import { createInsertSchema } from 'drizzle-zod';

const feeTypes = mysqlTable('fee_types', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(), // e.g., "School Supply", "Internship Fee"
  createdAt: timestamp('created_at').defaultNow(),
});

const feeTypeInsertSchema = createInsertSchema(feeTypes, {
  name: schema => schema.min(3),
}).omit({
  id: true,
  createdAt: true,
});

export { feeTypeInsertSchema, feeTypes };
