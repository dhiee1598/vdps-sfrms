import { decimal, int, mysqlEnum, mysqlTable, varchar } from 'drizzle-orm/mysql-core';

const transaction_items = mysqlTable('transaction_items', {
  id: int('id').autoincrement().primaryKey(),
  transaction_id: varchar('transaction_id', { length: 36 }).notNull(),
  status: mysqlEnum('status', ['pending', 'paid']).notNull().default('pending'),
  item_type: mysqlEnum('item_type', ['Full Payment', 'Downpayment', '1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter', 'sundry']).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
});

export { transaction_items };
