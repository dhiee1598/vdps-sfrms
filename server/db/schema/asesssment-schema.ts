import {
  decimal,
  int,
  mysqlTable,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const assessments = mysqlTable("assessments", {
  id: int("id").primaryKey().autoincrement(),
  enrollment_id: int("enrollment_id").notNull(),
  student_id: varchar("student_id", { length: 255 }).notNull(),
  total_amount_due: decimal("total_amount_due", {
    precision: 10,
    scale: 2,
  }).notNull(),
  is_esc_grant: boolean("is_esc_grant").default(false),
  is_cash_discount: boolean("is_cash_discount").default(false),
  createdAt: timestamp().defaultNow(),
});

export const assessmentInsertSchema = createInsertSchema(assessments, {
  total_amount_due: () =>
    z.coerce.number().transform((v) => Number(v.toFixed(2))),
  is_esc_grant: () => z.boolean().optional(),
  is_cash_discount: () => z.boolean().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const assessmentSelectSchema = createSelectSchema(assessments);
