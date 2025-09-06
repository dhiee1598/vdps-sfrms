import { decimal, int, mysqlTable, varchar } from 'drizzle-orm/mysql-core';
import { createInsertSchema } from 'drizzle-zod';
import z from 'zod';

const transaction_items = mysqlTable('transaction_items', {
  id: int('id').autoincrement().primaryKey(),
  transaction_id: varchar('transaction_id', { length: 36 }).notNull(),
  item_type: varchar({ length: 255 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
});

export const transactionItemInsertSchema = createInsertSchema(transaction_items).omit({
  id: true,
  transaction_id: true,
}).extend({
  amount: z.coerce.number().transform(v => Number(v.toFixed(2))),
});
export { transaction_items };
