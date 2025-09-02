import { int, mysqlTable, timestamp, varchar } from 'drizzle-orm/mysql-core';
import { createInsertSchema } from 'drizzle-zod';

const strands = mysqlTable('strands', {
  id: int('id').autoincrement().primaryKey(),
  strand_name: varchar({ length: 255 }).notNull(),
  strand_description: varchar({ length: 255 }).notNull(),
  createdAt: timestamp().defaultNow(),
});

const strandsInsertSchema = createInsertSchema(strands, {
  strand_name: schema => schema.min(3),
  strand_description: schema => schema.min(3),
}).omit({
  id: true,
  createdAt: true,
});

export { strands, strandsInsertSchema };
