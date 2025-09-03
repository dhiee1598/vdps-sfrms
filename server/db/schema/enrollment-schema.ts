import { decimal, int, mysqlTable, timestamp, varchar } from 'drizzle-orm/mysql-core';
import { createInsertSchema } from 'drizzle-zod';

const enrollments = mysqlTable('enrollments', {
  student_id: varchar({ length: 255 }).primaryKey().notNull(),
  strand_id: varchar({ length: 255 }).primaryKey().notNull(),
  gradeLevel_id: varchar({ length: 255 }).primaryKey().notNull(),
  semester_id: varchar({ length: 255 }).primaryKey().notNull(),
  academic_year_id: varchar({ length: 255 }).primaryKey().notNull(),
  enroll_status: varchar('enroll_status', { length: 255 }).notNull().default('enrolled'),
  date_enrolled: timestamp('date_enrolled').notNull().defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

const enrollmentsInsertSchema = createInsertSchema(enrollments, {
  student_id: schema => schema.nonempty(),
  strand_id: schema => schema.nonempty(),
  gradeLevel_id: schema => schema.nonempty(),
  semester_id: schema => schema.nonempty(),
  academic_year_id: schema => schema.nonempty(),
}).omit({
  createdAt: true,
  date_enrolled: true,
});

export { enrollments, enrollmentsInsertSchema };
