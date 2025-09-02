import db from '~~/server/db';
import { studentInsertSchema, students, studentSelectSchema } from '~~/server/db/schema/student.schema';
import { and, eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  // * Read and validate the request body against the studentInsertSchema.
  const body = await readValidatedBody(event, studentInsertSchema.safeParse);

  // ! If body validation fails, throw a 400 Bad Request error.
  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Invalid request body provided.',
    });
  }

  const whereConditions = [eq(students.first_name, body.data.first_name), eq(students.last_name, body.data.last_name)];

  if (body.data.middle_name) {
    whereConditions.push(eq(students.middle_name, body.data.middle_name));
  }

  // *  Check for existing student base on where conditions
  const [existingStudent] = await db.select()
    .from(students)
    .where(and(...whereConditions));

  // ! If student exists, throw a 409 Conflict error
  if (existingStudent) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: 'Student already exist',
    });
  }

  // * Insert new student
  const [createdStudent] = await db.insert(students).values(body.data).$returningId();

  // * Retrieve and return created student data
  const [getNewStudent] = await db.select().from(students).where(eq(students.id, createdStudent.id));
  const parsedStudent = studentSelectSchema.parse(getNewStudent);

  // * Set the HTTP status code to 201 Created
  setResponseStatus(event, 201);

  return {
    message: 'Student successfully created.',
    data: parsedStudent,
  };
});
