import db from '~~/server/db';
import { users, userSelectSchema } from '~~/server/db/schema/user-schema';

export default defineEventHandler(async () => {
  const allUsers = await db.select().from(users);
  const parsedAllUsers = userSelectSchema.array().parse(allUsers);
  return parsedAllUsers;
});
