import db from "~~/server/db";
import { fees, feesInsertSchema } from "~~/server/db/schema/fees-schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  const body = await readValidatedBody(event, feesInsertSchema.safeParse);

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Invalid data provided. Please check the required fields.",
    });
  }

  const { fee_name, fee_description } = body.data;

  const [existingFeeType] = await db
    .select()
    .from(fees)
    .where(eq(fees.fee_name, fee_name));

  if (existingFeeType) {
    throw createError({
      statusCode: 409,
      statusMessage: "Conflict",
      message: "A fee with this name already exists.",
    });
  }

  const [createdFeeType] = await db
    .insert(fees)
    .values({
      fee_name,
      fee_description,
    })
    .$returningId();

  event.context.io.emit("newData", "A new fees has been added.");

  return {
    success: true,
    data: createdFeeType,
    message: "Fee created successfully.",
  };
});
