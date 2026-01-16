import db from "~~/server/db";
import {
  gradeLevelFees,
  gradeLevelFeesInsertSchema,
} from "~~/server/db/schema/grade-level-fees-schema";
import { gradeLevel } from "~~/server/db/schema/grade-level-schema";
import { eq, isNull, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const data = gradeLevelFeesInsertSchema.parse(body);

    const selectedGradeLevel = (
      await db
        .select()
        .from(gradeLevel)
        .where(eq(gradeLevel.id, data.grade_level_id))
        .limit(1)
    )[0];

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

    const conditions = [
      eq(gradeLevelFees.grade_level_id, data.grade_level_id),
      eq(gradeLevelFees.fee_id, data.fee_id),
    ];

    if (data.strand_id) {
      conditions.push(eq(gradeLevelFees.strand_id, data.strand_id));
    } else {
      conditions.push(isNull(gradeLevelFees.strand_id));
    }
    const [existingGradeLevelFee] = await db
      .select()
      .from(gradeLevelFees)
      .where(and(...conditions));

    if (existingGradeLevelFee) {
      throw createError({
        statusCode: 409,
        statusMessage: "Conflict",
        message:
          "This fee type is already assigned to this grade level (and strand, if applicable).",
      });
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
