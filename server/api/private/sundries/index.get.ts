import db from '~~/server/db';
import { sundries } from '~~/server/db/schema/sundry-schema';

export default defineEventHandler(async () => {
  const allSundries = await db
    .select()
    .from(sundries);

  return {
    message: 'Fetch All Sundries',
    data: allSundries,
  };
});
