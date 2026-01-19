// server/api/private/student.post.ts
import db from "~~/server/db";
import {
  studentInsertSchema,
  students,
  studentSelectSchema,
} from "~~/server/db/schema/student-schema";
import { and, desc, eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  // 1. Validate body
  const body = await readValidatedBody(event, studentInsertSchema.safeParse);

  if (!body.success) {
    throw createError({
      statusCode: 400,
      message: "Invalid request body provided.",
    });
  }

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
      message: "Student already exists.",
    });
  }

  const last = await db
    .select({ id: students.id })
    .from(students)
    .orderBy(desc(students.id))
    .limit(1);

  let nextNumber = 1;
  const year = new Date().getFullYear();

  if (last.length > 0) {
    const lastId = last[0].id;
    const parts = lastId.split("-");
    if (parts[2] === String(year)) {
      nextNumber = Number.parseInt(parts[1], 10) + 1;
    }
  }

  const formattedNumber = String(nextNumber).padStart(4, "0");
  const newId = `STU-${formattedNumber}-${year}`;

  await db.insert(students).values({
    ...body.data,
    id: newId,
  });

  const [newStudent] = await db
    .select()
    .from(students)
    .where(eq(students.id, newId));

  const parsedStudent = studentSelectSchema.parse(newStudent);

  setResponseStatus(event, 201);
  return {
    message: "Student successfully created.",
    data: parsedStudent,
  };
});
