import db from "~~/server/db";
import { fees } from "~~/server/db/schema/fees-schema";
import { and, eq, ne } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  // Require a user session (send back 401 if no `user` key in session)
  await requireUserSession(event);

  const id = Number(event.context.params?.id);
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID is required",
      message: "ID is required",
    });
  }

  const body = await readBody(event);
  const [existingFee] = await db
    .select()
    .from(fees)
    .where(and(eq(fees.fee_name, body.fee_name), ne(fees.id, id)));

  if (existingFee) {
    throw createError({
      statusCode: 409,
      statusMessage: "Conflict",
      message: "A fee with this name already exists.",
    });
  }
  if (existingFee) {
    throw createError({
      statusCode: 409,
      statusMessage: "Conflict",
      message: "A fee with this name already exists.",
    });
  }

  const result = await db
    .update(fees)
    .set({
      fee_name: body.fee_name,
      fee_description: body.fee_description,
    })
    .where(eq(fees.id, id))
    .execute();

  event.context.io.emit("newData", "A new fees has been updated.");

  return { success: true, data: result, message: "Fee updated successfully" };
});
