import { and, eq, isNull } from "drizzle-orm";
import db from "~~/server/db";
import { fees } from "~~/server/db/schema/fees-schema";
import { gradeLevelFees } from "~~/server/db/schema/grade-level-fees-schema";
import { gradeLevel } from "~~/server/db/schema/grade-level-schema";
import { strands } from "~~/server/db/schema/strands-schema";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const gradeLevelId = query.grade_level_id
      ? Number(query.grade_level_id)
      : null;
    const strandId = query.strand_id ? Number(query.strand_id) : null;
    const isShs = query.is_shs ? query.is_shs === "true" : false;

    const queryBuilder = db
      .select({
        id: gradeLevelFees.id,
        grade_level_id: gradeLevelFees.grade_level_id,
        grade_level_name: gradeLevel.grade_level_name,
        strand_id: gradeLevelFees.strand_id,
        strand_name: strands.strand_name,
        fee_id: gradeLevelFees.fee_id,
        fee_name: fees.fee_name,
        amount: gradeLevelFees.amount,
      })
      .from(gradeLevelFees)
      .leftJoin(gradeLevel, eq(gradeLevelFees.grade_level_id, gradeLevel.id))
      .leftJoin(fees, eq(gradeLevelFees.fee_id, fees.id))
      .leftJoin(strands, eq(gradeLevelFees.strand_id, strands.id));

    if (gradeLevelId) {
      const conditions = [eq(gradeLevelFees.grade_level_id, gradeLevelId)];
      if (isShs) {
        if (strandId) {
          conditions.push(eq(gradeLevelFees.strand_id, strandId));
        } else {
          conditions.push(isNull(gradeLevelFees.strand_id));
        }
      }

      queryBuilder.where(and(...conditions));
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
