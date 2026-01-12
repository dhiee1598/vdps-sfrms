import { eq } from "drizzle-orm";
import db from "~~/server/db";
import {
  gradeLevelFees,
  gradeLevelFeesInsertSchema,
} from "~~/server/db/schema/grade-level-fees-schema";

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id);
    if (!id) {
      throw new Error("ID is required");
    }

    const body = await readBody(event);
    const data = gradeLevelFeesInsertSchema.parse(body);

    await db.update(gradeLevelFees).set(data).where(eq(gradeLevelFees.id, id));

    return {
      message: "Grade level fee updated successfully",
    };
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message,
    });
  }
});
