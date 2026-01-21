import {
  decimal,
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const sundries = mysqlTable("sundries", {
  id: int("id").autoincrement().primaryKey(),
  sundry_name: varchar("sundry_name", { length: 100 }).notNull(), // e.g., "Laboratory Fee"
  sundry_description: text("sundry_description"), // optional description
  sundry_amount: decimal("sundry_amount", {
    precision: 10,
    scale: 2,
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

const sundryInsertSchema = createInsertSchema(sundries, {
  sundry_name: (schema) => schema.min(1), // string
  sundry_description: (schema) => schema.optional(), // int
  sundry_amount: () =>
    z.coerce.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount"),
}).omit({
  id: true,
  createdAt: true,
});

export { sundries, sundryInsertSchema };
