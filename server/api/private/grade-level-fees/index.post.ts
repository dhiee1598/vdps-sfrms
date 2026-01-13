import db from "~~/server/db";
import {
  gradeLevelFees,
  gradeLevelFeesInsertSchema,
} from "~~/server/db/schema/grade-level-fees-schema";
import { gradeLevel } from "~~/server/db/schema/grade-level-schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  try {
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
          statusMessage:
            "Strand is required for Senior High School grade levels.",
        });
      }
    }

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
