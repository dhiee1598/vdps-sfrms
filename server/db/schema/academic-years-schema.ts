import { boolean, int, mysqlTable, timestamp, varchar } from 'drizzle-orm/mysql-core';
import { createInsertSchema } from 'drizzle-zod';

const academicYears = mysqlTable('academicYears', {
  id: int('id').autoincrement().primaryKey(),
  academic_year: varchar({ length: 255 }).notNull(),

  status: boolean('status').notNull().default(false),
  createdAt: timestamp().defaultNow(),
});

const academicYearsInsertSchema = createInsertSchema(academicYears, {
  academic_year: schema => schema.min(3),
}).omit({
  id: true,
  createdAt: true,
});

export { academicYears, academicYearsInsertSchema };
