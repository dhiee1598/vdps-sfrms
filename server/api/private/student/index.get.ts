import db from "~~/server/db";
import { academicYears } from "~~/server/db/schema/academic-years-schema";
import { enrollments } from "~~/server/db/schema/enrollment-schema";
import {
  students,
  studentSelectSchema,
} from "~~/server/db/schema/student-schema";
import { and, desc, eq, isNull, ne, or, like, sql } from "drizzle-orm";
import { getQuery } from "h3";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const enrolled = query.enrolled === "true";
  const carryOver = query.carryOver === "true";

  // Pagination & Search params
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 10;
  const search = (query.search as string) || "";
  const offset = (page - 1) * pageSize;

  // 1. get active academic year
  const activeYear = (
    await db
      .select({ year: academicYears })
      .from(academicYears)
      .where(eq(academicYears.status, true))
      .limit(1)
  )[0]?.year;

  if (!activeYear) {
    return { message: "No active academic year found", data: [] };
  }

  if (enrolled) {
    // 🔹 Students NOT enrolled in the current active year
    const conditions = [isNull(enrollments.student_id)];

    if (search) {
      conditions.push(
        or(
          like(students.first_name, `%${search}%`),
          like(students.last_name, `%${search}%`),
          like(students.middle_name, `%${search}%`),
          like(students.address, `%${search}%`)
        )
      );
    }

    const notEnrolledStudents = await db
      .select({ student: students })
      .from(students)
      .leftJoin(
        enrollments,
        and(
          eq(enrollments.student_id, students.id),
          eq(enrollments.academic_year_id, activeYear.id),
        ),
      )
      .where(and(...conditions))
      .orderBy(desc(students.last_name))
      .limit(50); // Limit to 50 for dropdown performance

    const parsed = studentSelectSchema
      .array()
      .parse(notEnrolledStudents.map((s) => s.student));

    return {
      message: "Not enrolled students (current year)",
      data: parsed,
    };
  }

  if (carryOver) {
    // 🔹 Students who are enrolled, but only in a *different* academic year (previous year)
    const prevEnrolled = await db
      .select({ student: students })
      .from(students)
      .innerJoin(
        enrollments,
        and(
          eq(enrollments.student_id, students.id),
          ne(enrollments.academic_year_id, activeYear.id), // not in current year
        ),
      )
      .orderBy(desc(students.last_name));

    const parsed = studentSelectSchema
      .array()
      .parse(prevEnrolled.map((s) => s.student));

    return {
      message: "Previously enrolled students (carry over to new year)",
      data: parsed,
    };
  }

  // 🔹 fallback → all students (Paginated & Searchable)
  const searchCondition = search
    ? or(
        like(students.first_name, `%${search}%`),
        like(students.last_name, `%${search}%`),
        like(students.middle_name, `%${search}%`),
        like(students.address, `%${search}%`),
        like(students.id, `%${search}%`)
      )
    : undefined;

  // Get total count
  const totalCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(students)
    .where(searchCondition);
  const total = Number(totalCountResult[0]?.count || 0);

  // Get paginated data
  const allStudents = await db
    .select()
    .from(students)
    .where(searchCondition)
    .limit(pageSize)
    .offset(offset)
    .orderBy(desc(students.last_name));

  const parsedAll = studentSelectSchema.array().parse(allStudents);

  return {
    message: "All students fetched successfully",
    data: parsedAll,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
});
