import { int, mysqlTable, varchar } from 'drizzle-orm/mysql-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const students = mysqlTable('students', {
  id: int().primaryKey().autoincrement().notNull(),
  first_name: varchar({ length: 255 }).notNull(),
  middle_name: varchar({ length: 255 }),
  last_name: varchar({ length: 255 }).notNull(),
  address: varchar({ length: 255 }),
  contact_number: varchar({ length: 255 }),
});

export const studentInsertSchema = createInsertSchema(students).omit({ id: true });
export const studentSelectSchema = createSelectSchema(students);
