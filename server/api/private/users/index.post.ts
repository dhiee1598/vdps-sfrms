import db from '~~/server/db';
import { userInsertSchema, users } from '~~/server/db/schema/user-schema';
import { eq } from 'drizzle-orm';
// A Nuxt.js server route handler for creating a new user.
export default defineEventHandler(async (event) => {
  // Require a user session (send back 401 if no `user` key in session)
  await requireUserSession(event);

  // Read and validate the request body against the user insertion schema.
  // The userInsertSchema.safeParse method provides a safe way to handle
  // validation, returning a result object that indicates success or failure.
  const body = await readValidatedBody(event, userInsertSchema.safeParse);

  // If validation fails, throw a custom error with a 400 Bad Request status.
  // This provides a clear status message and a user-friendly error message.
  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Missing required fields or invalid data.',
    });
  }

  // Destructure the validated data for easier access.
  const { name, email, password } = body.data;

  // Query the database to check if a user with the provided email already exists.
  // The `select` and `where` clauses are used to find a single user by email.
  const [existingEmail] = await db.select().from(users).where(eq(users.email, email));

  // If a user with the email is found, throw a 409 Conflict error.
  // A conflict status is more specific than a general 406 and accurately
  // reflects that the request cannot be completed due to a conflict with
  // the current state of the resource (the user's email).
  if (existingEmail) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: 'This email is already taken.',
    });
  }

  // Hash the user's password securely before storing it in the database.
  const passwordHashed = await hashPassword(password);

  // Insert the new user into the database and retrieve the newly created user's ID.
  const [createdUser] = await db.insert(users).values({
    name,
    email,
    password: passwordHashed,
  }).$returningId();

  // Fetch the complete user object from the database using the new ID.
  // This step ensures that the returned user object contains all the necessary
  // data, including any default values or timestamps set by the database.
  const [user] = await db.select().from(users).where(eq(users.id, createdUser.id));

  // Return a success message and the newly created user object.
  // A 201 Created status code would be ideal here for a more RESTful API,
  // but since `defineEventHandler` defaults to 200 OK, a clear message
  // is provided instead.
  return {
    statusCode: 201,
    statusMessage: 'Created',
    message: 'User created successfully.',
    user,
  };
});
