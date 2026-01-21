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
import { sundries } from "../schema/sundry-schema";
import { enrollments } from "../schema/enrollment-schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- HELPER 1: Parse Student List Name ---
function parseStudentListName(nameString: string) {
  if (!nameString || !nameString.includes(',')) {
    return { firstName: nameString || "", middleName: null, lastName: "" };
  }
  const [lastName, rest] = nameString.split(',').map((s) => s.trim());
  if (!rest) return { firstName: "", middleName: null, lastName };

  const nameParts = rest.split(' ');
  const lastPart = nameParts[nameParts.length - 1];
  const isMiddleInitial = /^[A-Z]\.?$/i.test(lastPart);

  let firstName: string;
  let middleName: string | null;

  if (isMiddleInitial) {
    middleName = nameParts.pop()?.replace('.', '') || null;
    firstName = nameParts.join(' ');
  } else {
    middleName = null;
    firstName = nameParts.join(' ');
  }
  return { firstName, middleName, lastName };
}

async function main() {
  console.log("🧹 Cleaning database...");
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0;`);
  const tables = [
    enrollments,
    students,
    sections,
    gradeLevel,
    academicYears,
    users,
    strands,
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

  console.log("💰 Processing Fee Structures... (Skipped - Fees removed)");

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
  // 2. SEED STUDENTS & ENROLLMENTS
  // =========================================================
  console.log("📚 Seeding Students & Enrollments...");
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

      let finalContact = "N/A";
      if (row["CONTACT NUMBER"]) {
        const firstChunk = String(row["CONTACT NUMBER"])
          .split(/[;:\/ ]/)[0]
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
      await db.insert(enrollments).values({
        student_id: studentId,
        grade_level_id: targetGrade.id,
        section_id: targetSection.id,
        academic_year_id: activeAy.id,
        strand_id: currentStrandId,
        enroll_status: "ENROLLED",
      });
    }
    console.log(`   ✅ Processed Sheet: ${sheetName}`);
  }
}

main().then(() => {
  console.log("🚀 Seeding Complete.");
  process.exit(0);
});
