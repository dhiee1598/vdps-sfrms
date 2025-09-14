import db from '~~/server/db';
import { students } from '~~/server/db/schema/student-schema';
import { transactions } from '~~/server/db/schema/transaction-schema';
import { reportDataSchema } from '~~/server/lib/zod-schema';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as XLSX from 'xlsx/xlsx.mjs';

export default defineEventHandler(async (event) => {
  // Require a user session (send back 401 if no `user` key in session)
  await requireUserSession(event);

  const body = await readValidatedBody(event, reportDataSchema.safeParse);
  let buffer;

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Invalid data provided. Please check the required fields.',
    });
  }

  const fromDate = new Date(`${body.data.from_date}T00:00:00`);
  const toDate = new Date(`${body.data.to_date}T23:59:59`);

  const rows = await db
    .select({
      STUDENT_NAME: sql<string>`CONCAT(${students.first_name}, ' ', ${students.last_name})`,
      AMOUNT: transactions.total_amount,
      DATE_PAID: transactions.date_paid,
    })
    .from(transactions)
    .leftJoin(students, eq(students.id, transactions.student_id))
    .where(
      and(
        gte(transactions.date_paid, fromDate),
        lte(transactions.date_paid, toDate),
        eq(transactions.status, 'paid'),
      ),
    );

  const formatDate = (d: Date | null) => {
    if (!d)
      return '';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(d));
  };

  const formattedRows = rows.map(r => ({
    ...r,
    DATE_PAID: formatDate(r.DATE_PAID),
  }));

  // For EXCEL DOWNLOAD
  if (body.data.type === 'excel') {
    const headerAOA = [
      ['Payment Report'],
      [`Period: ${body.data.from_date} - ${body.data.to_date}`],
      [],
      ['STUDENT_NAME', 'AMOUNT', 'DATE_PAID'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(headerAOA);

    const dataAOA = formattedRows.map(r => [r.STUDENT_NAME, r.AMOUNT, r.DATE_PAID]);
    XLSX.utils.sheet_add_aoa(ws, dataAOA, { origin: -1 });

    ws['!merges'] = ws['!merges'] || [];
    ws['!merges'].push(
      { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
    );

    ws['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }];

    const headerRowsCount = headerAOA.length;
    for (let i = 0; i < dataAOA.length; i++) {
      const excelRow = headerRowsCount + i + 1;
      const cellAddr = `B${excelRow}`;
      const cell = ws[cellAddr];
      if (cell && typeof cell.v === 'number') {
        cell.t = 'n';
        cell.z = '#,##0.00';
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, ws, 'Report');

    buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    event.node.res.setHeader(
      'Content-Disposition',
      `attachment; filename="report_${body.data.from_date}_to_${body.data.to_date}.xlsx"`,
    );
    event.node.res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
  }
  else {
    // For PDF
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const MARGIN = 50;
    const HEADER_Y = 800;
    const LINE_HEIGHT = 18;
    const FOOTER_MARGIN = 50;

    function drawHeaders(currentPage: any, fromDate: string, toDate: string) {
      currentPage.drawText('Payment Report', { x: MARGIN, y: HEADER_Y, size: 18, font, color: rgb(0, 0, 0) });
      currentPage.drawText(`Period: ${fromDate} - ${toDate}`, { x: MARGIN, y: HEADER_Y - 30, size: 12, font });
      currentPage.drawText('STUDENT_NAME', { x: MARGIN, y: HEADER_Y - 70, size: 12, font });
      currentPage.drawText('AMOUNT', { x: 250, y: HEADER_Y - 70, size: 12, font });
      currentPage.drawText('DATE_PAID', { x: 350, y: HEADER_Y - 70, size: 12, font });
    }

    drawHeaders(page, body.data.from_date, body.data.to_date);

    let y = HEADER_Y - 90;

    formattedRows.forEach((r) => {
      if (y < FOOTER_MARGIN) {
        page = pdfDoc.addPage([595, 842]);
        drawHeaders(page, body.data.from_date, body.data.to_date);
        y = HEADER_Y - 90;
      }

      page.drawText(r.STUDENT_NAME, { x: MARGIN, y, size: 11, font });
      page.drawText(r.AMOUNT.toString(), { x: 250, y, size: 11, font });
      page.drawText(r.DATE_PAID, { x: 350, y, size: 11, font });

      y -= LINE_HEIGHT;
    });

    buffer = await pdfDoc.save();

    event.node.res.setHeader(
      'Content-Disposition',
      `attachment; filename="report_${body.data.from_date}_to_${body.data.to_date}.pdf"`,
    );
    event.node.res.setHeader('Content-Type', 'application/pdf');
  }

  return buffer;
});
