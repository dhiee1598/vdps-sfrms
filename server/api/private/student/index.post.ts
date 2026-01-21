// server/api/private/student.post.ts
import db from '~~/server/db';
import {
  studentInsertSchema,
  students,
  studentSelectSchema,
} from '~~/server/db/schema/student-schema';
import { and, eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  // 1. Validate body
  const body = await readValidatedBody(event, studentInsertSchema.safeParse);

  if (!body.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request body provided.',
    });
  }

  // Check if Student ID already exists
  const [existingId] = await db
    .select()
    .from(students)
    .where(eq(students.id, body.data.id));

  if (existingId) {
    throw createError({
      statusCode: 409,
      message: 'Student ID already exists.',
    });
  }

  // Check for duplicate name
  const conditions = [
    eq(students.first_name, body.data.first_name),
    eq(students.last_name, body.data.last_name),
  ];
  if (body.data.middle_name) {
    conditions.push(eq(students.middle_name, body.data.middle_name));
  }

  const [existingStudent] = await db
    .select()
    .from(students)
    .where(and(...conditions));

  if (existingStudent) {
    throw createError({
      statusCode: 409,
      message: 'Student name already exists.',
    });
  }

  await db.insert(students).values(body.data);

  const [newStudent] = await db
    .select()
    .from(students)
    .where(eq(students.id, body.data.id));

  const parsedStudent = studentSelectSchema.parse(newStudent);

  setResponseStatus(event, 201);
  return {
    message: 'Student successfully created.',
    data: parsedStudent,
  };
});
