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

// const user = { name: 'John' };
// const parsed: { name: string, age: number } = userInsertSchema.parse(user); // Error: `age` is not defined

// const user = { name: 'Jane', age: 30 };
// const parsed: { name: string, age: number } = userInsertSchema.parse(user); // Will parse successfully
// await db.insert(users).values(parsed);
