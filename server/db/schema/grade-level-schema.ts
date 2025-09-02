import { int, mysqlTable, timestamp, varchar } from 'drizzle-orm/mysql-core';
import { createInsertSchema } from 'drizzle-zod';

const gradeLevel = mysqlTable('gradeLevel', {
  id: int('id').autoincrement().primaryKey(),
  grade_level_name: varchar({ length: 255 }).notNull(),
  createdAt: timestamp().defaultNow(),
});

const gradeLevelInsertSchema = createInsertSchema(gradeLevel, {
  grade_level_name: schema => schema.min(3),
}).omit({
  id: true,
  createdAt: true,
});

export { gradeLevel, gradeLevelInsertSchema };
