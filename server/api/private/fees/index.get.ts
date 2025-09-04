import db from '~~/server/db';
import { fees } from '~~/server/db/schema/fees-schema';

export default defineEventHandler(async () => {
  const allFees = await db.select().from(fees);
  return {
    message: 'Fetch All Fees Successfully',
    data: allFees,
  };
});
