import { int, mysqlTable, timestamp, varchar } from 'drizzle-orm/mysql-core';
import { createInsertSchema } from 'drizzle-zod';

const course = mysqlTable('course', {
  id: int('id').autoincrement().primaryKey(),
  course_name: varchar({ length: 255 }).notNull(),
  course_description: varchar({ length: 255 }).notNull(),
  createdAt: timestamp().defaultNow(),
});

const courseInsertSchema = createInsertSchema(course, {
  course_name: schema => schema.min(3),
  course_description: schema => schema.min(3),
}).omit({
  id: true,
  createdAt: true,
});

export { course, courseInsertSchema };
