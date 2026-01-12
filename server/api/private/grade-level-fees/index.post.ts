import db from "~~/server/db";
import {
  gradeLevelFees,
  gradeLevelFeesInsertSchema,
} from "~~/server/db/schema/grade-level-fees-schema";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const data = gradeLevelFeesInsertSchema.parse(body);

    await db.insert(gradeLevelFees).values(data);

    return {
      message: "Grade level fee created successfully",
    };
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message,
    });
  }
});
