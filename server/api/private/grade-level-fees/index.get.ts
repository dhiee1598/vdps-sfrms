import { eq } from "drizzle-orm";
import db from "~~/server/db";
import { fees } from "~~/server/db/schema/fees-schema";
import { gradeLevelFees } from "~~/server/db/schema/grade-level-fees-schema";
import { gradeLevel } from "~~/server/db/schema/grade-level-schema";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const gradeLevelId = query.grade_level_id
      ? Number(query.grade_level_id)
      : null;

    const queryBuilder = db
      .select({
        id: gradeLevelFees.id,
        grade_level_id: gradeLevel.id,
        grade_level_name: gradeLevel.grade_level_name,
        fee_id: fees.id,
        fee_name: fees.fee_name,
        amount: gradeLevelFees.amount,
      })
      .from(gradeLevelFees)
      .leftJoin(gradeLevel, eq(gradeLevelFees.grade_level_id, gradeLevel.id))
      .leftJoin(fees, eq(gradeLevelFees.fee_id, fees.id));

    if (gradeLevelId) {
      queryBuilder.where(eq(gradeLevelFees.grade_level_id, gradeLevelId));
    }

    const data = await queryBuilder;

    return {
      data,
    };
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message,
    });
  }
});
