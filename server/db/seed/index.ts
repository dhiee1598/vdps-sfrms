import 'dotenv/config';

import db from '..';
import { users } from '../schema/user-schema';
import { students } from '../schema/student-schema';
import { enrollments } from '../schema/enrollment-schema';
import { academicYears } from '../schema/academic-years-schema';
import { gradeLevel } from '../schema/grade-level-schema';
import { semesters } from '../schema/semester-schema';
import { fees } from '../schema/fees-schema';
import { sundries } from '../schema/sundry-schema';
import { strands } from '../schema/strands-schema';
import { sql } from 'drizzle-orm';

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone() {
  return '09' + Math.floor(100000000 + Math.random() * 900000000).toString();
}

function randomId(i: number) {
  // e.g. STU-0001-2025
  return `STU-${String(i).padStart(4, '0')}-2025`;
}

const firstNames = [
  'Juan',
  'Maria',
  'Jose',
  'Ana',
  'Pedro',
  'Luis',
  'Carmen',
  'Elena',
  'Miguel',
  'Sofia',
  'Gabriel',
  'Isabella',
  'Alexander',
  'Olivia',
  'Julian',
  'Ava',
];
const middleNames = ['Santos', 'Cruz', 'Garcia', 'Reyes', 'Dela', 'Torres', 'Castro', 'Navarro', 'Diaz', 'Flores'];
const lastNames = [
  'Dela Cruz',
  'Santos',
  'Reyes',
  'Garcia',
  'Torres',
  'Mendoza',
  'Castillo',
  'Ramos',
  'Fernandez',
  'Morales',
  'Gonzales',
  'Hernandez',
  'Martinez',
  'Lopez',
  'Sanchez',
  'Perez',
  'Gomez',
  'Rodriguez',
  'Flores',
  'Diaz',
  'Santiago',
  'Rivera',
  'Ortiz',
  'Cruz',
  'Gutierrez',
  'Vega',
  'Gonzalez',
  'Vasquez',
  'Bautista',
  'Romero',
  'Medina',
  'Chavez',
  'Jimenez',
  'Aguilar',
  'Rubio',
];
const addresses = ['Quezon City', 'Manila', 'Cebu City', 'Davao City', 'Baguio', 'Iloilo City'];


async function main() {
  // Insert Admin Account
  await db.insert(users).values({
    name: 'Admin',
    email: 'admin@gmail.com',
    password: '$scrypt$n=16384,r=8,p=1$dcsmGB+pSW97NeRaxPwllw$XKv1l3Rro8PQO8Y8YmyVR5XY/h4yTBWqTeucAm+gqieVG1uGdmxXdI8MiWNIedqZH6Xw8IR96OGOBq4sz6S01Q',
    role: 'admin'
  })
  .onDuplicateKeyUpdate({
    set: {
      name: 'Admin',
      password: '$scrypt$n=16384,r=8,p=1$dcsmGB+pSW97NeRaxPwllw$XKv1l3Rro8PQO8Y8YmyVR5XY/h4yTBWqTeucAm+gqieVG1uGdmxXdI8MiWNIedqZH6Xw8IR96OGOBq4sz6S01Q',
    }
  });

   // Insert Cashier Account
  await db.insert(users).values({
    name: 'Cashier',
    email: 'cashier@gmail.com',
    password: '$scrypt$n=16384,r=8,p=1$dcsmGB+pSW97NeRaxPwllw$XKv1l3Rro8PQO8Y8YmyVR5XY/h4yTBWqTeucAm+gqieVG1uGdmxXdI8MiWNIedqZH6Xw8IR96OGOBq4sz6S01Q',
    role: 'cashier'
  })
  .onDuplicateKeyUpdate({
    set: {
      name: 'Cashier',
      password: '$scrypt$n=16384,r=8,p=1$dcsmGB+pSW97NeRaxPwllw$XKv1l3Rro8PQO8Y8YmyVR5XY/h4yTBWqTeucAm+gqieVG1uGdmxXdI8MiWNIedqZH6Xw8IR96OGOBq4sz6S01Q',
    }
  });

}

async function seedStudentsAndEnrollments() {
  const studentData: any[] = [];
  const enrollmentData: any[] = [];

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

  }

  await db.insert(students).values(studentData).onDuplicateKeyUpdate({
    set: {
          first_name: sql`VALUES(first_name)`,
    last_name: sql`VALUES(last_name)`,
    },
  });

}

  
async function seedAcademicYears() {
  const years = [
    { academic_year: '2023-2024', status: false },
    { academic_year: '2024-2025', status: true }, // current year
  ];
  await db.insert(academicYears).values(years).onDuplicateKeyUpdate({ set: { academic_year: sql`VALUES(academic_year)` } });
}

async function seedGradeLevels() {
  const levels = [
    { grade_level_name: 'Grade 7' },
    { grade_level_name: 'Grade 8' },
    { grade_level_name: 'Grade 9' },
    { grade_level_name: 'Grade 10' },
    { grade_level_name: 'Grade 11' },
    { grade_level_name: 'Grade 12' },
  ];
  await db.insert(gradeLevel).values(levels).onDuplicateKeyUpdate({ set: { grade_level_name: sql`VALUES(grade_level_name)` } });
}

async function seedSemesters() {
  const data = [
    { semester: '1st Semester', status: true },
    { semester: '2nd Semester', status: false },
  ];
  await db.insert(semesters).values(data).onDuplicateKeyUpdate({ set: { semester: sql`VALUES(semester)` } });
}

async function seedFees() {
  const data = [
    { fee_name: 'Tuition Fee', fee_description: 'Base tuition fee', fee_amount: '15000.00' },
    { fee_name: 'Miscellaneous Fee', fee_description: 'Library, sports, etc.', fee_amount: '5000.00' },
    { fee_name: 'Laboratory Fee', fee_description: 'Science/Computer labs', fee_amount: '3000.00' },
  ];
  await db.insert(fees).values(data).onDuplicateKeyUpdate({ set: { fee_name: sql`VALUES(fee_name)` } });
}

async function seedSundries() {
  const data = [
    { sundry_name: 'School ID', sundry_description: 'One-time ID issuance', sundry_amount: '250.00' },
    { sundry_name: 'Uniform', sundry_description: '2 sets of uniforms', sundry_amount: '1200.00' },
    { sundry_name: 'PE Uniform', sundry_description: 'PE attire set', sundry_amount: '800.00' },
  ];
  await db.insert(sundries).values(data).onDuplicateKeyUpdate({ set: { sundry_name: sql`VALUES(sundry_name)` } });
}

async function seedStrands() {
  const data = [
    { strand_name: 'STEM', strand_description: 'Science, Technology, Engineering & Math' },
    { strand_name: 'ABM', strand_description: 'Accountancy, Business & Management' },
    { strand_name: 'HUMSS', strand_description: 'Humanities & Social Sciences' },
    { strand_name: 'GAS', strand_description: 'General Academic Strand' },
    { strand_name: 'TVL', strand_description: 'Technical-Vocational-Livelihood' },
  ];
  await db.insert(strands).values(data).onDuplicateKeyUpdate({ set: { strand_name: sql`VALUES(strand_name)` } });
}


(async () => {
  try {
    await main();
    await seedStudentsAndEnrollments();
        await seedAcademicYears();
    await seedGradeLevels();
    await seedSemesters();
    await seedFees();
    await seedSundries();
    await seedStrands();

    console.log('Seed complete');
    process.exit(0);
  }
  catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
})();
