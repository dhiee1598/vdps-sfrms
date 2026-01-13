import "dotenv/config";

import db from "..";
import { users } from "../schema/user-schema";
import { students } from "../schema/student-schema";
import { enrollments } from "../schema/enrollment-schema";
import { academicYears } from "../schema/academic-years-schema";
import { gradeLevel } from "../schema/grade-level-schema";
import { fees } from "../schema/fees-schema";
import { sundries } from "../schema/sundry-schema";
import { strands } from "../schema/strands-schema";
import { sql, eq } from "drizzle-orm";
import { sections } from "../schema/section-schema";

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone() {
  return "09" + Math.floor(100000000 + Math.random() * 900000000).toString();
}

function randomId(i: number) {
  return `STU-${String(i).padStart(4, "0")}-2025`;
}

const firstNames = [
  "Juan",
  "Maria",
  "Jose",
  "Ana",
  "Pedro",
  "Luis",
  "Carmen",
  "Elena",
  "Miguel",
  "Sofia",
  "Gabriel",
  "Isabella",
  "Alexander",
  "Olivia",
  "Julian",
  "Ava",
];
const middleNames = [
  "Santos",
  "Cruz",
  "Garcia",
  "Reyes",
  "Dela",
  "Torres",
  "Castro",
  "Navarro",
  "Diaz",
  "Flores",
];
const lastNames = [
  "Dela Cruz",
  "Santos",
  "Reyes",
  "Garcia",
  "Torres",
  "Mendoza",
  "Castillo",
  "Ramos",
  "Fernandez",
  "Morales",
  "Gonzales",
  "Hernandez",
  "Martinez",
  "Lopez",
  "Sanchez",
  "Perez",
  "Gomez",
  "Rodriguez",
  "Flores",
  "Diaz",
  "Santiago",
  "Rivera",
  "Ortiz",
  "Cruz",
  "Gutierrez",
  "Vega",
  "Gonzalez",
  "Vasquez",
  "Bautista",
  "Romero",
  "Medina",
  "Chavez",
  "Jimenez",
  "Aguilar",
  "Rubio",
];
const addresses = [
  "Quezon City",
  "Manila",
  "Cebu City",
  "Davao City",
  "Baguio",
  "Iloilo City",
];

async function main() {
  // Insert Admin Account
  await db
    .insert(users)
    .values({
      name: "Admin",
      email: "admin@gmail.com",
      password:
        "$scrypt$n=16384,r=8,p=1$dcsmGB+pSW97NeRaxPwllw$XKv1l3Rro8PQO8Y8YmyVR5XY/h4yTBWqTeucAm+gqieVG1uGdmxXdI8MiWNIedqZH6Xw8IR96OGOBq4sz6S01Q",
      role: "admin",
    })
    .onDuplicateKeyUpdate({
      set: {
        name: "Admin",
        password:
          "$scrypt$n=16384,r=8,p=1$dcsmGB+pSW97NeRaxPwllw$XKv1l3Rro8PQO8Y8YmyVR5XY/h4yTBWqTeucAm+gqieVG1uGdmxXdI8MiWNIedqZH6Xw8IR96OGOBq4sz6S01Q",
      },
    });

  // Insert Cashier Account
  await db
    .insert(users)
    .values({
      name: "Cashier",
      email: "cashier@gmail.com",
      password:
        "$scrypt$n=16384,r=8,p=1$dcsmGB+pSW97NeRaxPwllw$XKv1l3Rro8PQO8Y8YmyVR5XY/h4yTBWqTeucAm+gqieVG1uGdmxXdI8MiWNIedqZH6Xw8IR96OGOBq4sz6S01Q",
      role: "cashier",
    })
    .onDuplicateKeyUpdate({
      set: {
        name: "Cashier",
        password:
          "$scrypt$n=16384,r=8,p=1$dcsmGB+pSW97NeRaxPwllw$XKv1l3Rro8PQO8Y8YmyVR5XY/h4yTBWqTeucAm+gqieVG1uGdmxXdI8MiWNIedqZH6Xw8IR96OGOBq4sz6S01Q",
      },
    });
}

async function seedStudentsAndEnrollments() {
  const studentData: any[] = [];
  const enrollmentData: any[] = [];

  const [activeYear] = await db
    .select()
    .from(academicYears)
    .where(eq(academicYears.status, true))
    .limit(1);
  if (!activeYear) {
    throw new Error(
      "No active academic year found. Please seed academic years first.",
    );
  }

  const allGradeLevels = await db.select().from(gradeLevel);
  if (allGradeLevels.length === 0) {
    throw new Error("No grade levels found. Please seed grade levels first.");
  }

  const allStrands = await db.select().from(strands);
  const allSections = await db.select().from(sections);
  if (allSections.length === 0) {
    throw new Error("No sections found. Please seed sections first.");
  }

  for (let i = 1; i <= 100; i++) {
    const id = randomId(i);
    const first = randomItem(firstNames);
    const middle = randomItem(middleNames);
    const last = randomItem(lastNames);

    studentData.push({
      id,
      first_name: first,
      middle_name: middle,
      last_name: last,
      address: randomItem(addresses),
      contact_number: randomPhone(),
    });

    const grade = randomItem(allGradeLevels);
    
    let strandIdForEnrollment: number | null = null;
    if (['Grade 11', 'Grade 12'].includes(grade.grade_level_name) && allStrands.length > 0) {
        strandIdForEnrollment = randomItem(allStrands).id;
    }
    
    const sectionsForGrade = allSections.filter((s) => s.grade_level_id === grade.id);
    const section = randomItem(sectionsForGrade.length > 0 ? sectionsForGrade : allSections);

    enrollmentData.push({
      student_id: id,
      academic_year_id: activeYear.id,
      grade_level_id: grade.id,
      strand_id: strandIdForEnrollment,
      section_id: section.id,
    });
  }

  await db
    .insert(students)
    .values(studentData)
    .onDuplicateKeyUpdate({
      set: {
        first_name: sql`VALUES(first_name)`,
        last_name: sql`VALUES(last_name)`,
      },
    });

  await db
    .insert(enrollments)
    .values(enrollmentData)
    .onDuplicateKeyUpdate({
      set: {
        grade_level_id: sql`VALUES(grade_level_id)`,
        section_id: sql`VALUES(section_id)`,
      },
    });
}

async function seedAcademicYears() {
  const years = [
    { academic_year: "2023-2024", status: false },
    { academic_year: "2024-2025", status: true }, // current year
  ];
  await db
    .insert(academicYears)
    .values(years)
    .onDuplicateKeyUpdate({
      set: { academic_year: sql`VALUES(academic_year)` },
    });
}

async function seedGradeLevels() {
  const levels = [
    { grade_level_name: "Grade 7" },
    { grade_level_name: "Grade 8" },
    { grade_level_name: "Grade 9" },
    { grade_level_name: "Grade 10" },
    { grade_level_name: "Grade 11" },
    { grade_level_name: "Grade 12" },
  ];
  await db
    .insert(gradeLevel)
    .values(levels)
    .onDuplicateKeyUpdate({
      set: { grade_level_name: sql`VALUES(grade_level_name)` },
    });
}

async function seedSections() {
  const allGradeLevels = await db.select().from(gradeLevel);
  const sectionsData = [];

  for (const grade of allGradeLevels) {
    sectionsData.push({ section_name: `${grade.grade_level_name} - A`, grade_level_id: grade.id });
    sectionsData.push({ section_name: `${grade.grade_level_name} - B`, grade_level_id: grade.id });
  }

  await db.insert(sections).values(sectionsData).onDuplicateKeyUpdate({ set: { section_name: sql`VALUES(section_name)` } });
}

async function seedFees() {
  const data = [
    { fee_name: "Tuition Fee", fee_description: "Base tuition fee" },
    { fee_name: "Miscellaneous Fee", fee_description: "Library, sports, etc." },
    { fee_name: "Laboratory Fee", fee_description: "Science/Computer labs" },
  ];
  await db
    .insert(fees)
    .values(data)
    .onDuplicateKeyUpdate({ set: { fee_name: sql`VALUES(fee_name)` } });
}

async function seedSundries() {
  const data = [
    {
      sundry_name: "School ID",
      sundry_description: "One-time ID issuance",
      sundry_amount: "250.00",
    },
    {
      sundry_name: "Uniform",
      sundry_description: "2 sets of uniforms",
      sundry_amount: "1200.00",
    },
    {
      sundry_name: "PE Uniform",
      sundry_description: "PE attire set",
      sundry_amount: "800.00",
    },
  ];
  await db
    .insert(sundries)
    .values(data)
    .onDuplicateKeyUpdate({ set: { sundry_name: sql`VALUES(sundry_name)` } });
}

async function seedStrands() {
  const data = [
    {
      strand_name: "STEM",
      strand_description: "Science, Technology, Engineering & Math",
    },
    {
      strand_name: "ABM",
      strand_description: "Accountancy, Business & Management",
    },
    {
      strand_name: "HUMSS",
      strand_description: "Humanities & Social Sciences",
    },
    { strand_name: "GAS", strand_description: "General Academic Strand" },
    {
      strand_name: "TVL",
      strand_description: "Technical-Vocational-Livelihood",
    },
  ];
  await db
    .insert(strands)
    .values(data)
    .onDuplicateKeyUpdate({ set: { strand_name: sql`VALUES(strand_name)` } });
}

(async () => {
  try {
    await main();
    await seedAcademicYears();
    await seedGradeLevels();
    await seedStrands();
    await seedSections();
    await seedStudentsAndEnrollments();
    await seedFees();
    await seedSundries();

    console.log("Seed complete");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
})();
