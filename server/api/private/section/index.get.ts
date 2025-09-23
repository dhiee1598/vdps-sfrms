import db from '~~/server/db';
import { sections } from '~~/server/db/schema/section-schema';

export default defineEventHandler(async (_event) => {
  const allSections = await db.select().from(sections);

  return {
    message: 'Fetch Section Successfully',
    data: allSections,
  };
});
