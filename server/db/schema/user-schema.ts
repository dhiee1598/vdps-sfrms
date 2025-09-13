import { int, mysqlTable, timestamp, varchar } from 'drizzle-orm/mysql-core';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import z from 'zod';

const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  profile_image: varchar({ length: 255 }),
  role: varchar({ length: 255 }),
  createdAt: timestamp().defaultNow(),
});

const userInsertSchema = createInsertSchema(users, {
  name: schema => schema.min(3),
  email: schema => schema.min(3),
  password: schema => schema.min(8, ({ message: 'minimum of 8 chars' })),
}).omit({
  id: true,
  createdAt: true,
  profile_image: true,
  role: true,
});

const userSelectSchema = createSelectSchema(users).omit({ password: true });

const userUpdateSchema = createUpdateSchema(users)
  .omit({ createdAt: true, id: true, role: true, password: true })
  .extend({
    old_password: z.string().optional(),
    new_password: z.string().optional(),
  });

export { userInsertSchema, users, userSelectSchema, userUpdateSchema };
