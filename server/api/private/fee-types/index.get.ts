import db from '~~/server/db';
import { feeTypes } from '~~/server/db/schema/fee-type-schema';

export default defineEventHandler(async () => {
  const allFeeTypes = await db.select().from(feeTypes);
  return allFeeTypes;
});
