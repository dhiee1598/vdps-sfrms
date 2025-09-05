import { int, mysqlTable, timestamp, varchar } from 'drizzle-orm/mysql-core';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';

const enrollments = mysqlTable('enrollments', {
  id: int().primaryKey().autoincrement().notNull(),
  student_id: varchar({ length: 255 }).notNull(),
  strand_id: int().notNull(),
  grade_level_id: int().notNull(),
  semester_id: int().notNull(),
  academic_year_id: int().notNull(),
  enroll_status: varchar('enroll_status', { length: 255 }).notNull().default('ENROLLED'),
  date_enrolled: timestamp('date_enrolled').notNull().defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

const enrollmentsInsertSchema = createInsertSchema(enrollments).omit({
  id: true,
  createdAt: true,
  date_enrolled: true,
});

export const enrollmentSelectSchema = createSelectSchema(enrollments);
export const enrollmentUpdateSchema = createUpdateSchema(enrollments);

export { enrollments, enrollmentsInsertSchema };
