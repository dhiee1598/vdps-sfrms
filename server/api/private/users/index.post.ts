import db from '~~/server/db';
import { userInsertSchema, users } from '~~/server/db/schema/user-schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  const body = await readValidatedBody(event, userInsertSchema.safeParse);

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Missing required fields or invalid data.',
    });
  }

  const { name, email, password } = body.data;

  const [existingEmail] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (existingEmail) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: 'This email is already taken.',
    });
  }

  const passwordHashed = await hashPassword(password);

  const [createdUser] = await db
    .insert(users)
    .values({
      name,
      email,
      password: passwordHashed,
    })
    .$returningId();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, createdUser.id));

  return {
    statusCode: 201,
    statusMessage: 'Created',
    message: 'User created successfully.',
    user,
  };
});
