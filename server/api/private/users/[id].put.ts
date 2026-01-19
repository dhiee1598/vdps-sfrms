import db from "~~/server/db";
import { users, userUpdateSchema } from "~~/server/db/schema/user-schema";
import { and, eq, ne } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  const id = Number(event.context.params?.id);
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid ID",
      message: "User ID is required in the request URL.",
    });
  }

  const body = await readValidatedBody(event, userUpdateSchema.safeParse);

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Missing required fields or invalid data.",
    });
  }

  const [existingEmail] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, String(body.data.email)), ne(users.id, id)));

  if (existingEmail) {
    throw createError({
      statusCode: 409,
      statusMessage: "Conflict",
      message: "The email address is already in use by another account.",
    });
  }

  const [userToUpdate] = await db.select().from(users).where(eq(users.id, id));

  if (!userToUpdate) {
    throw createError({
      statusCode: 404,
      statusMessage: "Not Found",
      message: "User not found.",
    });
  }

  if (body.data.new_password && body.data.old_password) {
    const isPasswordValid = await verifyPassword(
      userToUpdate.password,
      body.data.old_password,
    );

    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
        message: "The current password you entered is incorrect.",
      });
    }
  }

  await db
    .update(users)
    .set({
      name: body.data.name,
      email: body.data.email,
      password: body.data.new_password
        ? await hashPassword(body.data.new_password)
        : userToUpdate.password,
      profile_image: body.data.profile_image,
    })
    .where(eq(users.id, id));

  return {
    statusCode: 200,
    statusMessage: "OK",
    message: "User updated successfully.",
  };
});
