import { int, mysqlTable, timestamp, varchar } from 'drizzle-orm/mysql-core';
import { createInsertSchema } from 'drizzle-zod';

const sections = mysqlTable('sections', {
  id: int('id').autoincrement().primaryKey(),
  section_name: varchar({ length: 255 }).notNull(),
  createdAt: timestamp().defaultNow(),
});

const sectionInsertSchema = createInsertSchema(sections, {
  section_name: schema => schema.min(3),
}).omit({
  id: true,
  createdAt: true,
});

export { sectionInsertSchema, sections };
