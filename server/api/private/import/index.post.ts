// server/api/private/student/import.post.ts
import type { File } from 'formidable';

import db from '~~/server/db';
import {
  studentInsertSchema,
  students,
  studentSelectSchema,
} from '~~/server/db/schema/student-schema';
import { and, desc, eq } from 'drizzle-orm';
import formidable from 'formidable';
import { readFileSync } from 'node:fs';
import * as XLSX from 'xlsx';

type ExcelStudentRow = {
  FIRST_NAME?: string;
  MIDDLE_NAME?: string;
  LAST_NAME?: string;
  ADDRES?: string;
  CONTACT_NUMBER?: string;
};

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  // Formidable setup
  const form = formidable({
    multiples: false,
    allowEmptyFiles: false,
  });

  // Parse request
  const { files } = await new Promise<{ fields: any; files: formidable.Files }>(
    (resolve, reject) => {
      form.parse(event.node.req, (err, fields, files) => {
        if (err)
          reject(err);
        else resolve({ fields, files });
      });
    },
  );

  // Get uploaded file safely
  const uploadedFile: File | undefined = Array.isArray(files.file)
    ? files.file[0]
    : (files.file as File | undefined);

  if (!uploadedFile?.filepath) {
    throw createError({
      statusCode: 400,
      message: 'No Excel file uploaded.',
    });
  }

  // ---- Read Excel using buffer (fix for Nitro / serverless) ----
  const fileBuffer = readFileSync(uploadedFile.filepath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<ExcelStudentRow>(sheet);

  const importedStudents: ReturnType<typeof studentSelectSchema.parse>[] = [];

  // Get last student ID to start sequence
  const last = await db
    .select({ id: students.id })
    .from(students)
    .orderBy(desc(students.id))
    .limit(1);

  const currentYear = new Date().getFullYear();
  let sequence = 1;

  if (last.length > 0) {
    const parts = last[0].id.split('-'); // e.g. STU-0005-2025
    if (parts[2] === String(currentYear)) {
      sequence = Number(parts[1]) + 1;
    }
  }

  for (const row of rawRows) {
    try {
      // Map Excel columns → DB fields
      const prepared = {
        first_name: row.FIRST_NAME ?? '',
        middle_name: row.MIDDLE_NAME ?? '',
        last_name: row.LAST_NAME ?? '',
        address: row.ADDRES ?? '',
        contact_number: row.CONTACT_NUMBER?.toString() ?? '',
      };

      // Validate with Zod
      const parsed = studentInsertSchema.parse(prepared);

      // Duplicate check
      const conditions = [
        eq(students.first_name, parsed.first_name),
        eq(students.last_name, parsed.last_name),
      ];

      if (parsed.middle_name) {
        conditions.push(eq(students.middle_name, parsed.middle_name));
      }

      const [existing] = await db
        .select()
        .from(students)
        .where(and(...conditions));

      if (existing) {
        console.warn(`Skipping duplicate: ${parsed.first_name} ${parsed.last_name}`);
        continue;
      }

      // Generate new student ID
      const formatted = String(sequence).padStart(4, '0');
      const newId = `STU-${formatted}-${currentYear}`;
      sequence++;

      // Insert into DB
      await db.insert(students).values({
        ...parsed,
        id: newId,
      });

      // Retrieve inserted record
      const [inserted] = await db
        .select()
        .from(students)
        .where(eq(students.id, newId));

      importedStudents.push(studentSelectSchema.parse(inserted));
    }
    catch (err) {
      console.warn('Invalid row skipped:', err);
    }
  }

  setResponseStatus(event, 201);
  return {
    message: `Successfully imported ${importedStudents.length} students.`,
    data: importedStudents,
  };
});
