import db from '~~/server/db';
import {
  sectionInsertSchema,
  sections,
} from '~~/server/db/schema/section-schema';
import { and, eq, ne } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  const id = Number(event.context.params?.id);
  const body = await readValidatedBody(event, sectionInsertSchema.safeParse);

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID is required',
      message: 'ID is required',
    });
  }

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Minimum of 3 and maximum of 50 characters allowed',
    });
  }

  const [existingSection] = await db
    .select()
    .from(sections)
    .where(
      and(
        eq(sections.section_name, body.data.section_name),
        ne(sections.id, id),
      ),
    );

  if (existingSection) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: 'A section with this name already exists.',
    });
  }

  const result = await db
    .update(sections)
    .set({
      section_name: body.data.section_name,
      grade_level_id: body.data.grade_level_id,
    })
    .where(eq(sections.id, id))
    .execute();

  return {
    success: true,
    data: result,
    message: 'Section updated successfully',
  };
});
