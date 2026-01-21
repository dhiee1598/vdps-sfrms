import db from '~~/server/db';
import {
  students,
  studentUpdateSchema,
} from '~~/server/db/schema/student-schema';
import { and, eq, isNull, ne } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  const id = getRouterParam(event, 'id');
  const body = await readValidatedBody(event, studentUpdateSchema.safeParse);

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Student ID is required.',
    });
  }

  if (!body.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request body provided.',
    });
  }

  // 1. Check if trying to change ID to one that already exists
  if (body.data.id && body.data.id !== id) {
    const [existingId] = await db
      .select()
      .from(students)
      .where(eq(students.id, body.data.id));

    if (existingId) {
      throw createError({
        statusCode: 409,
        message: 'New Student ID already exists.',
      });
    }
  }

  // 2. Check for duplicate name (excluding current student)
  if (body.data.first_name && body.data.last_name) {
    const middleNameCondition = body.data.middle_name
      ? eq(students.middle_name, body.data.middle_name)
      : isNull(students.middle_name);

    const [existingStudent] = await db
      .select()
      .from(students)
      .where(
        and(
          eq(students.first_name, body.data.first_name),
          eq(students.last_name, body.data.last_name),
          middleNameCondition,
          ne(students.id, id), // Exclude self
        ),
      );

    if (existingStudent) {
      throw createError({
        statusCode: 409,
        message: 'Student name already exists.',
      });
    }
  }

  await db
    .update(students)
    .set(body.data)
    .where(eq(students.id, id));

  return {
    message: 'Student updated successfully.',
  };
});
