import db from "~~/server/db";
import { academicYears } from "~~/server/db/schema/academic-years-schema";
import {
  students,
  studentSelectSchema,
} from "~~/server/db/schema/student-schema";
import { and, desc, eq, isNull, ne, or, like, sql } from "drizzle-orm";
import { getQuery } from "h3";
import { enrollments } from "~~/server/db/schema/enrollment-schema";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const enrolled = query.enrolled === "true";
  const carryOver = query.carryOver === "true";

  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 10;
  const search = (query.search as string) || "";
  const offset = (page - 1) * pageSize;

  // 1. Get Active Academic Year
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

  // 2. Fetch Students NOT Enrolled in Active Year
  if (enrolled) {
    const conditions = [isNull(enrollments.student_id)];

    if (search) {
      const searchFilter = or(
        like(students.first_name, `%${search}%`),
        like(students.last_name, `%${search}%`),
        like(students.middle_name, `%${search}%`),
        like(students.address, `%${search}%`),
      );

      if (searchFilter) {
        conditions.push(searchFilter);
      }
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

  // 3. Fetch Students Enrolled in PREVIOUS Years (For Carry Over)
  if (carryOver) {
    const prevEnrolled = await db
      .select({ student: students })
      .from(students)
      .innerJoin(
        enrollments,
        and(
          eq(enrollments.student_id, students.id),
          ne(enrollments.academic_year_id, activeYear.id),
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

  // 4. Standard Fetch (All Students with Pagination)
  const searchCondition = search
    ? or(
      like(students.first_name, `%${search}%`),
      like(students.last_name, `%${search}%`),
      like(students.middle_name, `%${search}%`),
      like(students.address, `%${search}%`),
      like(students.id, `%${search}%`),
    )
    : undefined;

  const totalCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(students)
    .where(searchCondition);
  const total = Number(totalCountResult[0]?.count || 0);

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
