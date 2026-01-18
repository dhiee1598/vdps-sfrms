import db from '~~/server/db';
import { sundries } from '~~/server/db/schema/sundry-schema';
import { like } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const search = (query.search as string) || "";

  const allSundries = await db
    .select()
    .from(sundries)
    .where(search ? like(sundries.sundry_name, `%${search}%`) : undefined);

  return {
    message: 'Fetch All Sundries',
    data: allSundries,
  };
});
