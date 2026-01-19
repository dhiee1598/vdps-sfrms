import db from "~~/server/db";
import { sections } from "~~/server/db/schema/section-schema";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  const body = await readBody(event);

  const { grade_level_id, section_names } = body;

  if (!Array.isArray(section_names) || section_names.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Please provide an array of section names.",
    });
  }

  const insertedSections = await db
    .insert(sections)
    .values(
      section_names.map((section_name) => ({
        grade_level_id,
        section_name,
      })),
    )
    .$returningId();

  event.context.io.emit("newData", "A section has been added.");

  return {
    success: true,
    message: "Section Created Successfully",
    data: insertedSections,
  };
});
