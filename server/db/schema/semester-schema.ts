import { boolean, int, mysqlTable, timestamp, varchar } from 'drizzle-orm/mysql-core';
import { createInsertSchema } from 'drizzle-zod';

const semesters = mysqlTable('semesters', {
  id: int('id').autoincrement().primaryKey(),
  semester: varchar({ length: 255 }).notNull(),
  status: boolean('status').notNull().default(false),
  createdAt: timestamp().defaultNow(),
});

const semestersInsertSchema = createInsertSchema(semesters, {
  semester: schema => schema.min(3),
}).omit({
  id: true,
  createdAt: true,
});

export { semesters, semestersInsertSchema };
