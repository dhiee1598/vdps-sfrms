import { int, mysqlTable, timestamp, varchar } from 'drizzle-orm/mysql-core';
import { createInsertSchema } from 'drizzle-zod';

const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  createdAt: timestamp().defaultNow(),
});

const userInsertSchema = createInsertSchema(users, {
  name: schema => schema.min(3),
  email: schema => schema.min(3),
  password: schema => schema.min(8, ({ message: 'minimum of 8 chars' })),
}).omit({
  id: true,
  createdAt: true,
});

export { userInsertSchema, users };

// const user = { name: 'John' };
// const parsed: { name: string, age: number } = userInsertSchema.parse(user); // Error: `age` is not defined

// const user = { name: 'Jane', age: 30 };
// const parsed: { name: string, age: number } = userInsertSchema.parse(user); // Will parse successfully
// await db.insert(users).values(parsed);
