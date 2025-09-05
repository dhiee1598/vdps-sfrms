import db from '~~/server/db';
import { payments } from '~~/server/db/schema/payments-schema';

export default defineEventHandler(async () => {
  const allPayments = await db.select().from(payments);
  return allPayments;
});
