import { int, mysqlTable, timestamp, varchar } from 'drizzle-orm/mysql-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

const enrollments = mysqlTable('enrollments', {
  student_id: varchar({ length: 255 }).primaryKey().notNull(),
  strand_id: int().primaryKey().notNull(),
  grade_level_id: int().primaryKey().notNull(),
  semester_id: int().primaryKey().notNull(),
  academic_year_id: int().primaryKey().notNull(),
  enroll_status: varchar('enroll_status', { length: 255 }).notNull().default('enrolled'),
  date_enrolled: timestamp('date_enrolled').notNull().defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

const enrollmentsInsertSchema = createInsertSchema(enrollments, {}).omit({
  createdAt: true,
  date_enrolled: true,
});

export const enrollmentSelectSchema = createSelectSchema(enrollments);

export { enrollments, enrollmentsInsertSchema };
