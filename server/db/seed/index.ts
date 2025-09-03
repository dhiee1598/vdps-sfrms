import 'dotenv/config';

import db from '..';
import { users } from '../schema/user-schema';

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


(async () => {
  try {
    await main();
    console.log('Seed complete');
    process.exit(0);
  }
  catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
})();
