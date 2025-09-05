import 'dotenv/config';

import db from '..';
import { users } from '../schema/user-schema';
import { students } from '../schema/student-schema';
import { enrollments } from '../schema/enrollment-schema';
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


(async () => {
  try {
    await main();
    await seedStudentsAndEnrollments();

    console.log('Seed complete');
    process.exit(0);
  }
  catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
})();
