import db from "~~/server/db";
import {
  sundries,
  sundryInsertSchema,
} from "~~/server/db/schema/sundry-schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  const body = await readValidatedBody(event, sundryInsertSchema.safeParse);

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Invalid data provided. Please check the required fields.",
    });
  }

  const { sundry_name, sundry_description, sundry_amount } = body.data;

  const [existingSundry] = await db
    .select()
    .from(sundries)
    .where(eq(sundries.sundry_name, sundry_name));

  if (existingSundry) {
    throw createError({
      statusCode: 409,
      statusMessage: "Conflict",
      message: "A sundry with this name already exists.",
    });
  }

  const [createdSundry] = await db
    .insert(sundries)
    .values({
      sundry_name,
      sundry_description,
      sundry_amount,
    })
    .$returningId();

  event.context.io.emit("newData", "A new sundries has been added.");

  return {
    success: true,
    data: createdSundry,
    message: "Fee created successfully.",
  };
});
