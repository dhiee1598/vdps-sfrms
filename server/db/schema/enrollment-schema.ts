import {
  int,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";

const enrollments = mysqlTable(
  "enrollments",
  {
    id: int().primaryKey().autoincrement(),
    student_id: varchar("student_id", { length: 255 }).notNull(),
    strand_id: int("strand_id"),
    grade_level_id: int("grade_level_id").notNull(),
    section_id: int("section_id").notNull(),
    academic_year_id: int("academic_year_id").notNull(),
    enroll_status: varchar("enroll_status", { length: 255 })
      .notNull()
      .default("ENROLLED"),
    date_enrolled: timestamp("date_enrolled").notNull().defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => {
    return {
      unique_student_academic_year: uniqueIndex(
        "unique_student_academic_year",
      ).on(table.student_id, table.academic_year_id),
    };
  },
);

const enrollmentsInsertSchema = createInsertSchema(enrollments).omit({
  id: true,
  createdAt: true,
  date_enrolled: true,
});

export const enrollmentSelectSchema = createSelectSchema(enrollments);
export const enrollmentUpdateSchema = createUpdateSchema(enrollments);

export { enrollments, enrollmentsInsertSchema };
