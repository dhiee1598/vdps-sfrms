import db from '~~/server/db';
import { users } from '~~/server/db/schema/user-schema';

export default defineEventHandler(async () => {
  const allUsers = await db.select({ id: users.id, name: users.name, email: users.email, createdAt: users.createdAt }).from(users);
  return allUsers;
});
