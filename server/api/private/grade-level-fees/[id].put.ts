import { eq } from "drizzle-orm";
import db from "~~/server/db";
import {
  gradeLevelFees,
  gradeLevelFeesInsertSchema,
} from "~~/server/db/schema/grade-level-fees-schema";
import { gradeLevel } from "~~/server/db/schema/grade-level-schema";

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id);
    if (!id) {
      throw new Error("ID is required");
    }

    const body = await readBody(event);
    const data = gradeLevelFeesInsertSchema.parse(body);

    const selectedGradeLevel = (await db
      .select()
      .from(gradeLevel)
      .where(eq(gradeLevel.id, data.grade_level_id))
      .limit(1))[0];

    if (selectedGradeLevel) {
      const isShs =
        selectedGradeLevel.grade_level_name.toUpperCase() === "GRADE 11" ||
        selectedGradeLevel.grade_level_name.toUpperCase() === "GRADE 12";

      if (isShs && !data.strand_id) {
        throw createError({
          statusCode: 400,
          statusMessage: "Strand is required for Senior High School grade levels.",
        });
      }
    }

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
