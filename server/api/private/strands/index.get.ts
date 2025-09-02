import db from '~~/server/db';
import { strands } from '~~/server/db/schema/strands-schema';

export default defineEventHandler(async () => {
  const allStrands = await db.select().from(strands);
  return allStrands;
});
