import { and, eq, lt, sql } from 'drizzle-orm';

import db from '../db';
import { transactions } from '../db/schema/transaction-schema';

export default defineNitroPlugin(async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await db.delete(transactions).where(
    and(
      eq(transactions.status, 'pending'),
      lt(transactions.createdAt, sql`CURDATE()`),
    ),
  );
});
