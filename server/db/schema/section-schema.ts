import { int, mysqlTable, timestamp, varchar } from 'drizzle-orm/mysql-core';
import { createInsertSchema } from 'drizzle-zod';

const sections = mysqlTable('sections', {
  id: int('id').autoincrement().primaryKey(),
  section_name: varchar({ length: 255 }).notNull(),
  grade_level_id: int('grade_level_id').notNull(),
  createdAt: timestamp().defaultNow(),
});

const sectionInsertSchema = createInsertSchema(sections, {
  grade_level_id: schema => schema.int(),
  section_name: schema => schema.min(3),
}).omit({
  id: true,
  createdAt: true,
});

export { sectionInsertSchema, sections };
