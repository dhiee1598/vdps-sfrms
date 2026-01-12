import { int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";

const fees = mysqlTable("fees", {
  id: int("id").autoincrement().primaryKey(),
  fee_name: varchar("fee_name", { length: 100 }).notNull(),
  fee_description: varchar("fee_description", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

const feesInsertSchema = createInsertSchema(fees, {
  fee_name: (schema) => schema.min(3),
  fee_description: (schema) => schema.optional(),
}).omit({
  id: true,
  createdAt: true,
});

export { fees, feesInsertSchema };
