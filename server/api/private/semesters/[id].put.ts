import db from '~~/server/db';
import { semesters } from '~~/server/db/schema/semester-schema';
import { and, eq, ne } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  // Require a user session (send back 401 if no `user` key in session)
  await requireUserSession(event);

  const id = Number(event.context.params?.id);
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID is required',
      message: 'ID is required',
    });
  }

  const body = await readBody(event);
  const [existingSemester] = await db.select().from(semesters).where(and(eq(semesters.semester, body.semester), ne(semesters.id, id)));

  if (existingSemester) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: 'A Semester with this name already exists.',
    });
  }
  let result;
  if (body.semester) {
    result = await db
      .update(semesters)
      .set({
        semester: body.semester,
      })
      .where(eq(semesters.id, id))
      .execute();
  }
  else {
    await db.update(semesters).set({ status: false }).execute();
    result = await db.update(semesters).set({ status: true }).where(eq(semesters.id, id)).execute();
  }

  event.context.io.emit('newData', 'A new semester has been updated.');

  return { success: true, data: result, message: 'Semester updated successfully' };
});
