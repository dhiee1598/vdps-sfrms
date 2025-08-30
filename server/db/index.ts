import { drizzle } from 'drizzle-orm/mysql2';

import env from '../lib/env'; // Adjust path if needed

const db = drizzle(env.DATABASE_URL);

export default db;
