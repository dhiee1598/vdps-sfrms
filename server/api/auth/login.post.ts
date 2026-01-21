import db from '~~/server/db';
import { users } from '~~/server/db/schema/user-schema';
import { loginSchema } from '~~/server/lib/zod-schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, loginSchema.safeParse);

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Missing required fields or invalid data.',
    });
  }

  const { email, password } = body.data;

  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Invalid email or password.',
    });
  }

  const passwordMatch = await verifyPassword(user.password, password);

  if (!passwordMatch) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Invalid email or password.',
    });
  }

  await setUserSession(
    event,
    {
      user: {
        id: user.id,
        name: user.name,
        role: user.role!,
      },
      lastLoggedIn: new Date(),
    },
    {
      maxAge: 60 * 60 * 24 * 7,
    },
  );

  return {
    success: true,
    role: user.role,
  };
});
