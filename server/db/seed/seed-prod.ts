import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";

import db from "..";
import { users } from "../schema/user-schema";
import { gradeLevel } from "../schema/grade-level-schema";
import { sections } from "../schema/section-schema";
import { and, eq, sql, isNull, like } from "drizzle-orm";
import { academicYears } from "../schema/academic-years-schema";
import { strands } from "../schema/strands-schema";
import { students } from "../schema/student-schema";
import { fees } from "../schema/fees-schema";
import { gradeLevelFees } from "../schema/grade-level-fees-schema";
import { assessmentFees } from "../schema/assessment-fees-schema";
import { assessments } from "../schema/asesssment-schema";
import { sundries } from "../schema/sundry-schema";
import { transactions } from "../schema/transaction-schema";
import { transaction_items } from "../schema/transaction-items-schema";
import { enrollments } from "../schema/enrollment-schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- HELPER 1: Parse Student List Name ---
function parseStudentListName(nameString: string) {
  if (!nameString || !nameString.includes(",")) {
    return { firstName: nameString || "", middleName: null, lastName: "" };
  }
  const [lastName, rest] = nameString.split(",").map((s) => s.trim());
  if (!rest) return { firstName: "", middleName: null, lastName };

  const nameParts = rest.split(" ");
  const lastPart = nameParts[nameParts.length - 1];
  const isMiddleInitial = /^[A-Z]\.?$/i.test(lastPart);

  let firstName: string;
  let middleName: string | null;

  if (isMiddleInitial) {
    middleName = nameParts.pop()?.replace(".", "") || null;
    firstName = nameParts.join(" ");
  } else {
    middleName = null;
    firstName = nameParts.join(" ");
  }
  return { firstName, middleName, lastName };
}

// --- HELPER 2: Parse Transaction Name ---
function parseTransactionName(nameStr: string) {
  if (!nameStr) return null;
  const parts = nameStr.split(",").map((s) => s.trim());
  if (parts.length < 2) return null;

  const lastName = parts[0];
  const firstNameFull = parts[1];
  const firstNameFirstWord = firstNameFull.split(" ")[0];
  return { lastName, firstNameFirstWord };
}

// --- HELPER 3: Parse Date (Handles "1-Aug-25") ---
function parseTransactionDate(dateInput: any): Date {
  if (!dateInput) return new Date();

  if (typeof dateInput === "number") {
    return new Date(Math.round((dateInput - 25569) * 86400 * 1000));
  }

  const dateStr = String(dateInput).trim();
  const dMmmYyRegex = /^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/;
  const match = dateStr.match(dMmmYyRegex);

  if (match) {
    const day = parseInt(match[1], 10);
    const monthRaw = match[2].toLowerCase();
    let year = parseInt(match[3], 10);
    if (year < 100) year += 2000;

    const monthMap: { [key: string]: number } = {
      jan: 0,
      feb: 1,
      mar: 2,
      apr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      aug: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dec: 11,
    };
    if (monthMap[monthRaw] !== undefined) {
      return new Date(year, monthMap[monthRaw], day);
    }
  }

  const standardDate = new Date(dateStr);
  return isNaN(standardDate.getTime()) ? new Date() : standardDate;
}

// --- HELPER 4: Determine Item Type from Remarks ---
function getItemTypeFromRemarks(remarks: string, defaultMonth: string): string {
  if (!remarks) return defaultMonth;
  const upperRemarks = remarks.toUpperCase();

  // If remark contains specific keywords, treat as Downpayment
  if (
    upperRemarks.includes("RF") ||
    upperRemarks.includes("RPF") ||
    upperRemarks.includes("LRF") ||
    upperRemarks.includes("DOWNPAYMENT")
  ) {
    return "Reservation Fee";
  }

  return defaultMonth;
}

async function main() {
  console.log("🧹 Cleaning database...");
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0;`);
  const tables = [
    transaction_items,
    transactions,
    assessmentFees,
    assessments,
    enrollments,
    students,
    sections,
    gradeLevel,
    academicYears,
    users,
    strands,
    gradeLevelFees,
    fees,
    sundries,
  ];
  for (const table of tables) await db.execute(sql`TRUNCATE TABLE ${table}`);
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1;`);

  // --- 1. SEED REFERENCE DATA (Users, Grades, Sections, Fees...) ---
  await db.insert(users).values([
    {
      name: "Admin",
      email: "admin@gmail.com",
      password:
        "$scrypt$n=16384,r=8,p=1$dcsmGB+pSW97NeRaxPwllw$XKv1l3Rro8PQO8Y8YmyVR5XY/h4yTBWqTeucAm+gqieVG1uGdmxXdI8MiWNIedqZH6Xw8IR96OGOBq4sz6S01Q",
      role: "admin",
    },
    {
      name: "Cashier",
      email: "cashier@gmail.com",
      password:
        "$scrypt$n=16384,r=8,p=1$dcsmGB+pSW97NeRaxPwllw$XKv1l3Rro8PQO8Y8YmyVR5XY/h4yTBWqTeucAm+gqieVG1uGdmxXdI8MiWNIedqZH6Xw8IR96OGOBq4sz6S01Q",
      role: "cashier",
    },
  ]);

  await db
    .insert(academicYears)
    .values([{ academic_year: "2025-2026", status: true }]);
  const [activeAy] = await db
    .select()
    .from(academicYears)
    .where(eq(academicYears.academic_year, "2025-2026"));

  const gradeNames = [
    "NURSERY",
    "KINDER 1",
    "KINDER 2",
    "GRADE 1",
    "GRADE 2",
    "GRADE 3",
    "GRADE 4",
    "GRADE 5",
    "GRADE 6",
    "GRADE 7",
    "GRADE 8",
    "GRADE 9",
    "GRADE 10",
    "GRADE 11",
    "GRADE 12",
  ];
  await db
    .insert(gradeLevel)
    .values(gradeNames.map((name) => ({ grade_level_name: name })));
  const allGrades = await db.select().from(gradeLevel);

  const strandInputs = [
    {
      strand_name: "STEM",
      strand_description: "Science, Technology, Engineering, and Mathematics",
    },
    {
      strand_name: "ABM",
      strand_description: "Accountancy, Business, and Management",
    },
    {
      strand_name: "HUMSS",
      strand_description: "Humanities and Social Sciences",
    },
    { strand_name: "GAS", strand_description: "General Academic Strand" },
    {
      strand_name: "TVL",
      strand_description: "Technical-Vocational-Livelihood",
    },
  ];
  await db.insert(strands).values(strandInputs);
  const allStrands = await db.select().from(strands);

  const sectionsData = [
    { name: "BRIGHT", grade: "NURSERY" },
    { name: "ROSE", grade: "KINDER 1" },
    { name: "RUBY", grade: "KINDER 2" },
    { name: "MARIA RAFOLS", grade: "GRADE 1" },
    { name: "LOVABLE", grade: "GRADE 2" },
    { name: "CHARITABLE", grade: "GRADE 2" },
    { name: "EXCELLENT", grade: "GRADE 3" },
    { name: "BRILLIANT", grade: "GRADE 3" },
    { name: "VICTORIOUS", grade: "GRADE 4" },
    { name: "GENIUS", grade: "GRADE 4" },
    { name: "SHAKESPEARE", grade: "GRADE 5" },
    { name: "HELEN KELLER", grade: "GRADE 5" },
    { name: "GENTLEHOPE", grade: "GRADE 6" },
    { name: "TRIUMPHANT", grade: "GRADE 6" },
    { name: "ST. FRANCIS XAVIER", grade: "GRADE 7" },
    { name: "ST. JOSEPH", grade: "GRADE 7" },
    { name: "KING DAVID", grade: "GRADE 8" },
    { name: "KING SOLOMON", grade: "GRADE 8" },
    { name: "ST. TERESA OF AVILA", grade: "GRADE 9" },
    { name: "ST. THOMAS OF AQUINAS", grade: "GRADE 9" },
    { name: "ST. LORENZO RUIZ", grade: "GRADE 10" },
    { name: "ST. PEDRO CALUNGSOD", grade: "GRADE 10" },
    { name: "ST. ALBERT", grade: "GRADE 11" },
    { name: "ST. GREGORY THE GREAT", grade: "GRADE 11" },
    { name: "ST. JOHN", grade: "GRADE 12" },
    { name: "ST. LUKE", grade: "GRADE 12" },
  ];
  const sectionsToInsert = sectionsData
    .map((s) => {
      const gId = allGrades.find(
        (g) => g.grade_level_name.toUpperCase() === s.grade.toUpperCase(),
      )?.id;
      return { section_name: s.name, grade_level_id: gId };
    })
    .filter(
      (s): s is { section_name: string; grade_level_id: number } =>
        s.grade_level_id !== undefined,
    );
  await db.insert(sections).values(sectionsToInsert);
  const allSections = await db.select().from(sections);

  console.log("💰 Processing Fee Structures...");
  const feeTypes = [
    "Tuition Fee",
    "Miscellaneous Fee",
    "Other Fees",
    "Tech Dev Fee",
    "Tech Dev/TLE Fee",
    "TLE Fee",
  ];
  for (const name of feeTypes) await db.insert(fees).values({ fee_name: name });
  const allFees = await db.select().from(fees);
  const getFeeId = (name: string) =>
    allFees.find((f) => f.fee_name === name)?.id!;

  // (Standard Fees Seed - same as before)
  const feeSchedules = [
    {
      grades: ["NURSERY", "KINDER 1"],
      items: [
        { type: "Tuition Fee", amount: 27185.0 },
        { type: "Miscellaneous Fee", amount: 3380.0 },
        { type: "Other Fees", amount: 5465.0 },
      ],
    },
    {
      grades: ["KINDER 2"],
      items: [
        { type: "Tuition Fee", amount: 27185.0 },
        { type: "Miscellaneous Fee", amount: 3380.0 },
        { type: "Other Fees", amount: 8395.0 },
      ],
    },
    {
      grades: ["GRADE 1", "GRADE 2"],
      items: [
        { type: "Tuition Fee", amount: 26685.0 },
        { type: "Miscellaneous Fee", amount: 3760.0 },
        { type: "Other Fees", amount: 8040.0 },
        { type: "Tech Dev Fee", amount: 1700.0 },
      ],
    },
    {
      grades: ["GRADE 3"],
      items: [
        { type: "Tuition Fee", amount: 27020.0 },
        { type: "Miscellaneous Fee", amount: 3835.0 },
        { type: "Other Fees", amount: 8040.0 },
        { type: "Tech Dev Fee", amount: 1700.0 },
      ],
    },
    {
      grades: ["GRADE 4"],
      items: [
        { type: "Tuition Fee", amount: 27020.0 },
        { type: "Miscellaneous Fee", amount: 3835.0 },
        { type: "Other Fees", amount: 8040.0 },
        { type: "Tech Dev/TLE Fee", amount: 1780.0 },
      ],
    },
    {
      grades: ["GRADE 5"],
      items: [
        { type: "Tuition Fee", amount: 27345.0 },
        { type: "Miscellaneous Fee", amount: 3835.0 },
        { type: "Other Fees", amount: 8040.0 },
        { type: "Tech Dev/TLE Fee", amount: 1780.0 },
      ],
    },
    {
      grades: ["GRADE 6"],
      items: [
        { type: "Tuition Fee", amount: 27345.0 },
        { type: "Miscellaneous Fee", amount: 3835.0 },
        { type: "Other Fees", amount: 10970.0 },
        { type: "Tech Dev/TLE Fee", amount: 1780.0 },
      ],
    },
    {
      grades: ["GRADE 7", "GRADE 8"],
      items: [
        { type: "Tuition Fee", amount: 30145.0 },
        { type: "Miscellaneous Fee", amount: 4115.0 },
        { type: "Other Fees", amount: 8040.0 },
        { type: "Tech Dev/TLE Fee", amount: 1780.0 },
      ],
    },
    {
      grades: ["GRADE 9"],
      items: [
        { type: "Tuition Fee", amount: 31380.0 },
        { type: "Miscellaneous Fee", amount: 4115.0 },
        { type: "Other Fees", amount: 8040.0 },
        { type: "Tech Dev/TLE Fee", amount: 1780.0 },
      ],
    },
    {
      grades: ["GRADE 10"],
      items: [
        { type: "Tuition Fee", amount: 31380.0 },
        { type: "Miscellaneous Fee", amount: 4115.0 },
        { type: "Other Fees", amount: 10970.0 },
        { type: "Tech Dev/TLE Fee", amount: 1780.0 },
      ],
    },
    {
      grades: ["GRADE 11"],
      strands: ["TVL"],
      items: [
        { type: "Tuition Fee", amount: 33100.0 },
        { type: "Miscellaneous Fee", amount: 5010.0 },
        { type: "Other Fees", amount: 6365.0 },
        { type: "TLE Fee", amount: 80.0 },
      ],
    },
    {
      grades: ["GRADE 11"],
      strands: ["GAS", "HUMSS", "ABM"],
      items: [
        { type: "Tuition Fee", amount: 33725.0 },
        { type: "Miscellaneous Fee", amount: 5010.0 },
        { type: "Other Fees", amount: 6365.0 },
      ],
    },
    {
      grades: ["GRADE 11"],
      strands: ["STEM"],
      items: [
        { type: "Tuition Fee", amount: 34345.0 },
        { type: "Miscellaneous Fee", amount: 5010.0 },
        { type: "Other Fees", amount: 6365.0 },
      ],
    },
    {
      grades: ["GRADE 12"],
      strands: ["TVL"],
      items: [
        { type: "Tuition Fee", amount: 33100.0 },
        { type: "Miscellaneous Fee", amount: 5010.0 },
        { type: "Other Fees", amount: 9575.0 },
        { type: "TLE Fee", amount: 80.0 },
      ],
    },
    {
      grades: ["GRADE 12"],
      strands: ["GAS", "HUMSS", "ABM"],
      items: [
        { type: "Tuition Fee", amount: 33725.0 },
        { type: "Miscellaneous Fee", amount: 5010.0 },
        { type: "Other Fees", amount: 9575.0 },
      ],
    },
    {
      grades: ["GRADE 12"],
      strands: ["STEM"],
      items: [
        { type: "Tuition Fee", amount: 34345.0 },
        { type: "Miscellaneous Fee", amount: 5010.0 },
        { type: "Other Fees", amount: 9575.0 },
      ],
    },
  ];
  for (const schedule of feeSchedules) {
    const targetGradeIds = allGrades
      .filter((g) => schedule.grades.includes(g.grade_level_name.toUpperCase()))
      .map((g) => g.id);
    if (targetGradeIds.length === 0) continue;
    let targetStrandIds: (number | null)[] = [null];
    if (schedule.strands && schedule.strands.length > 0)
      targetStrandIds = allStrands
        .filter((s) => schedule.strands?.includes(s.strand_name.toUpperCase()))
        .map((s) => s.id);
    for (const gradeId of targetGradeIds) {
      for (const strandId of targetStrandIds) {
        for (const item of schedule.items)
          await db.insert(gradeLevelFees).values({
            grade_level_id: gradeId,
            strand_id: strandId,
            fee_id: getFeeId(item.type),
            amount: item.amount.toFixed(2),
          });
      }
    }
  }

  console.log("🎒 Seeding Sundries...");
  const sundriesData = [
    { name: "Clinic - Badminton", desc: "Clinic Program", amount: 2850.0 },
    { name: "Clinic - Basketball", desc: "Clinic Program", amount: 2850.0 },
    { name: "Clinic - Soccer", desc: "Clinic Program", amount: 2850.0 },
    {
      name: "Clinic - Swimming Lesson",
      desc: "Clinic Program",
      amount: 5000.0,
    },
    { name: "Clinic - Taekwondo", desc: "Clinic Program", amount: 3500.0 },
    { name: "Clinic - Volleyball", desc: "Clinic Program", amount: 2850.0 },
    { name: "Clinic - Table Tennis", desc: "Clinic Program", amount: 2850.0 },
    {
      name: "Clinic - Basic Guitar Lesson",
      desc: "Clinic Program",
      amount: 3500.0,
    },
    {
      name: "Clinic - Baton Flag Twirling",
      desc: "Clinic Program",
      amount: 3500.0,
    },
    { name: "Clinic - Cooking Lesson", desc: "Clinic Program", amount: 3500.0 },
    { name: "CTC (Form 138/137)", desc: "Certificates", amount: 50.0 },
    { name: "Good Moral Certificate", desc: "Certificates", amount: 100.0 },
    {
      name: "Certificate (Ranking/Enrolment)",
      desc: "Certificates",
      amount: 100.0,
    },
    { name: "Original Report Card", desc: "Certificates", amount: 180.0 },
    { name: "Form 137 with Doc. Stamp", desc: "Certificates", amount: 180.0 },
    { name: "Retreat 2026 (Grade 10)", desc: "Retreat Fee", amount: 4875.0 },
    { name: "Retreat 2026 (Grade 12)", desc: "Retreat Fee", amount: 5090.0 },
    {
      name: "Notebook - Writing (Pre-School)",
      desc: "School Supplies",
      amount: 35.0,
    },
    {
      name: "Notebook - Composition (1-12)",
      desc: "School Supplies",
      amount: 47.0,
    },
    { name: "Notebook - Math (Elem)", desc: "School Supplies", amount: 52.0 },
    { name: "Notebook - Math (HS Big)", desc: "School Supplies", amount: 65.0 },
    {
      name: "Application Processing Fee (Elem)",
      desc: "Application Fee",
      amount: 40.0,
    },
    { name: "Entrance Exam (Elem)", desc: "Application Fee", amount: 275.0 },
    {
      name: "Application Processing Fee (HS)",
      desc: "Application Fee",
      amount: 60.0,
    },
    { name: "Entrance Exam (HS)", desc: "Application Fee", amount: 375.0 },
  ];
  for (const item of sundriesData)
    await db.insert(sundries).values({
      sundry_name: item.name,
      sundry_description: item.desc,
      sundry_amount: item.amount.toFixed(2),
    });

  // =========================================================
  // 2. SEED STUDENTS & ASSESSMENTS
  // =========================================================
  console.log("📚 Seeding Students & Assessments...");
  const studentFile = "student1.xlsx";
  const studentPath = path.join(__dirname, studentFile);
  const studentWorkbook = XLSX.read(readFileSync(studentPath), {
    type: "buffer",
  });
  let studentCounter = 1;

  for (const sheetName of studentWorkbook.SheetNames) {
    let gradeSearch = "";
    let sectionSearch = "";
    if (sheetName.includes("-")) {
      const parts = sheetName.split("-").map((p) => p.trim().toUpperCase());
      if (parts[0].includes("KINDER")) {
        const match = parts[0].match(/\d+/);
        gradeSearch = match ? `KINDER ${match[0]}` : "KINDER";
      } else if (parts[0].match(/\d+/)) {
        gradeSearch = `GRADE ${parts[0].match(/\d+/)![0]}`;
      } else {
        gradeSearch = parts[0];
      }
      sectionSearch = parts[1];
    }
    const targetGrade = allGrades.find(
      (g) => g.grade_level_name.toUpperCase() === gradeSearch,
    );
    const targetSection = allSections.find(
      (s) =>
        s.grade_level_id === targetGrade?.id &&
        (sectionSearch.includes(s.section_name.toUpperCase()) ||
          s.section_name.toUpperCase().includes(sectionSearch)),
    );
    if (!targetGrade || !targetSection) continue;

    const gradeName = targetGrade.grade_level_name.toUpperCase();
    const isJHS = ["GRADE 7", "GRADE 8", "GRADE 9", "GRADE 10"].includes(
      gradeName,
    );
    const isSHS = ["GRADE 11", "GRADE 12"].includes(gradeName);

    const rawData = XLSX.utils.sheet_to_json(
      studentWorkbook.Sheets[sheetName],
      { defval: null },
    );
    let currentStrandId: number | null = null;

    for (const row of rawData as any[]) {
      const firstCol = String(Object.values(row)[0] || "")
        .trim()
        .toUpperCase();
      const foundStrand = allStrands.find((s) => s.strand_name === firstCol);
      if (foundStrand) {
        currentStrandId = foundStrand.id;
        continue;
      }
      if (!row["NAME"] || String(row["NAME"]).toUpperCase() === "NAME")
        continue;

      const { firstName, middleName, lastName } = parseStudentListName(
        row["NAME"],
      );
      const studentId = `STU-${String(studentCounter++).padStart(4, "0")}-2026`;
      const rawEsc = row["ESC GRANT"];
      const isEscGrant =
        rawEsc === true ||
        String(rawEsc).toUpperCase() === "YES" ||
        String(rawEsc).toUpperCase() === "TRUE" ||
        rawEsc == 1;

      let finalContact = "N/A";
      if (row["CONTACT NUMBER"]) {
        const firstChunk = String(row["CONTACT NUMBER"])
          .split(/[;:\\\/ ]/)[0]
          .trim();
        let cleanNumber = firstChunk.replace(/\D/g, "");
        if (cleanNumber.length === 10 && cleanNumber.startsWith("9"))
          cleanNumber = `0${cleanNumber}`;
        finalContact = /^09\d{9}$/.test(cleanNumber) ? cleanNumber : "N/A";
      }

      await db.insert(students).values({
        id: studentId,
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        address: row["ADDRESS"] || "N/A",
        contact_number: finalContact,
      });
      const [enrollmentResult] = await db.insert(enrollments).values({
        student_id: studentId,
        grade_level_id: targetGrade.id,
        section_id: targetSection.id,
        academic_year_id: activeAy.id,
        strand_id: currentStrandId,
        enroll_status: "ENROLLED",
      });

      const studentFees = await db
        .select()
        .from(gradeLevelFees)
        .where(
          and(
            eq(gradeLevelFees.grade_level_id, targetGrade.id),
            currentStrandId
              ? eq(gradeLevelFees.strand_id, currentStrandId)
              : isNull(gradeLevelFees.strand_id),
          ),
        );
      let totalDue = 0;
      const feeIdsToLink: number[] = [];
      for (const feeEntry of studentFees) {
        const feeType = allFees.find((f) => f.id === feeEntry.fee_id);
        if (isSHS && isEscGrant && feeType?.fee_name === "Tuition Fee")
          continue;
        totalDue += Number(feeEntry.amount);
        feeIdsToLink.push(feeEntry.fee_id);
      }
      if (isJHS && isEscGrant) totalDue -= 9000.0;
      if (totalDue < 0) totalDue = 0;
      const roundedTotal = Math.ceil(totalDue);

      const [assessmentResult] = await db.insert(assessments).values({
        enrollment_id: enrollmentResult.insertId,
        student_id: studentId,
        total_amount_due: roundedTotal.toFixed(2),
        is_esc_grant: isEscGrant,
        is_cash_discount: false,
      });
      if (feeIdsToLink.length > 0) {
        await db.insert(assessmentFees).values(
          feeIdsToLink.map((fid) => ({
            assessment_id: assessmentResult.insertId,
            fee_id: fid,
          })),
        );
      }
    }
    console.log(`   ✅ Processed Sheet: ${sheetName}`);
  }

  // =========================================================
  // 3. SEED PAYMENTS (transaction.xlsx)
  // =========================================================
  console.log("💸 Seeding Payments from transaction.xlsx...");
  const transactionFile = "transaction.xlsx";
  const txnPath = path.join(__dirname, transactionFile);
  const txnWorkbook = XLSX.read(readFileSync(txnPath), { type: "buffer" });

  for (const sheetName of txnWorkbook.SheetNames) {
    const monthName =
      sheetName.charAt(0).toUpperCase() + sheetName.slice(1).toLowerCase();
    console.log(
      `   📂 Processing Payment Month: ${monthName} (Sheet: ${sheetName})`,
    );

    const rawRows = XLSX.utils.sheet_to_json(txnWorkbook.Sheets[sheetName], {
      header: 1,
    }) as any[][];
    let headerRowIndex = -1;
    let nameIdx = -1;
    let totalIdx = -1;
    let dateIdx = -1;
    let remarksIdx = -1; // --- NEW: Added Remarks Column Index

    for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
      const row = rawRows[i].map((c) => String(c).trim().toUpperCase());
      if (row.includes("NAME") && row.includes("TOTAL")) {
        headerRowIndex = i;
        nameIdx = row.indexOf("NAME");
        totalIdx = row.indexOf("TOTAL");
        dateIdx = row.indexOf("DATE");
        remarksIdx = row.indexOf("REMARKS");
        console.log(
          `      🔎 Found Header at Row ${i} | Name: ${nameIdx} | Total: ${totalIdx} | Remarks: ${remarksIdx}`,
        );
        break;
      }
    }

    if (headerRowIndex === -1 || nameIdx === -1 || totalIdx === -1) {
      console.warn(
        `      ⚠️  Skipping: Could not find 'NAME' and 'TOTAL' header.`,
      );
      continue;
    }

    let count = 0;
    let missingCount = 0;

    for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || row.length === 0) continue;

      const rawName = row[nameIdx];
      const rawTotal = row[totalIdx];
      const rawDate = dateIdx !== -1 ? row[dateIdx] : null;
      const rawRemarks = remarksIdx !== -1 ? row[remarksIdx] : "";

      if (!rawName || !rawTotal) continue;

      const amount = Number(String(rawTotal).replace(/,/g, ""));
      if (isNaN(amount) || amount <= 0) continue;

      const nameInfo = parseTransactionName(String(rawName));
      if (!nameInfo) continue;

      const txnDate = parseTransactionDate(rawDate);

      const finalItemType = getItemTypeFromRemarks(
        String(rawRemarks),
        monthName,
      );

      const studentMatches = await db
        .select()
        .from(students)
        .where(
          and(
            eq(students.last_name, nameInfo.lastName),
            like(students.first_name, `%${nameInfo.firstNameFirstWord}%`),
          ),
        );

      if (studentMatches.length === 0) {
        if (missingCount < 3)
          console.warn(`      ⚠️  Match Failed: ${rawName}`);
        missingCount++;
        continue;
      }
      const student = studentMatches[0];

      const assessmentList = await db
        .select()
        .from(assessments)
        .where(eq(assessments.student_id, student.id));
      if (assessmentList.length === 0) continue;
      const assessment = assessmentList[assessmentList.length - 1];

      await db.transaction(async (tx) => {
        const [txn] = await tx
          .insert(transactions)
          .values({
            assessment_id: assessment.id,
            student_id: student.id,
            total_amount: amount.toFixed(2),
            status: "paid",
            date_paid: txnDate,
          })
          .$returningId();

        await tx.insert(transaction_items).values({
          transaction_id: txn.transaction_id,
          item_type: finalItemType,
          amount: amount.toFixed(2),
        });
      });
      count++;
    }
    console.log(`      -> Seeded ${count} transactions.`);
  }
}

main().then(() => {
  console.log("🚀 Seeding Complete.");
  process.exit(0);
});
