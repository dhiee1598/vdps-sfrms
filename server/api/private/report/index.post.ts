import { reportDataSchema } from '~~/server/lib/zod-schema';
import * as XLSX from 'xlsx/xlsx.mjs';

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, reportDataSchema.safeParse);

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Invalid data provided. Please check the required fields.',
    });
  }

  const rows = [
    { ID: 1, Name: 'John Doe', Amount: 500, Date: '2025-09-01' },
    { ID: 2, Name: 'Jane Smith', Amount: 700, Date: '2025-09-05' },
  ];

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

  // Convert to buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  // Return as file
  event.node.res.setHeader(
    'Content-Disposition',
    `attachment; filename="report_${body.data.from_date}_to_${body.data.to_date}.xlsx"`,
  );
  event.node.res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );

  return buffer;
});
