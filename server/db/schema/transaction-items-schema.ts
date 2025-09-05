import { decimal, int, mysqlTable, varchar } from 'drizzle-orm/mysql-core';

const transaction_items = mysqlTable('transaction_items', {
  id: int('id').autoincrement().primaryKey(),
  transaction_id: varchar('transaction_id', { length: 36 }).notNull(),
  item_type: varchar({ length: 255 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
});

export { transaction_items };
