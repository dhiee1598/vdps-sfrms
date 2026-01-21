import db from '~~/server/db';
import { sundries } from '~~/server/db/schema/sundry-schema';
import { and, eq, isNull, like, or } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const search = (query.search as string) || '';

  const conditions = [
    or(eq(sundries.is_archived, false), isNull(sundries.is_archived)),
  ];

  if (search) {
    conditions.push(like(sundries.sundry_name, `%${search}%`));
  }

  const allSundries = await db
    .select()
    .from(sundries)
    .where(and(...conditions));

  return {
    message: 'Fetch All Sundries',
    data: allSundries,
  };
});
