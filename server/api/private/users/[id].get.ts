import db from '~~/server/db';
import { users, userSelectSchema } from '~~/server/db/schema/user-schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid ID',
      message: 'Sundry ID is required in the request URL.',
    });
  }

  const [user] = await db.select().from(users).where(eq(users.id, id));
  const parsedUser = userSelectSchema.parse(user);

  return {
    message: 'Fetched user successfully',
    data: parsedUser,
  };
});
