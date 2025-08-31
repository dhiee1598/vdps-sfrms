import { int, mysqlTable, timestamp, varchar } from 'drizzle-orm/mysql-core';
import { createInsertSchema } from 'drizzle-zod';

const yearLevel = mysqlTable('yearLevel', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  createdAt: timestamp().defaultNow(),
});

const yearLevelInsertSchema = createInsertSchema(yearLevel, {
  name: schema => schema.min(3),
}).omit({
  id: true,
  createdAt: true,
});

export { yearLevel, yearLevelInsertSchema };
