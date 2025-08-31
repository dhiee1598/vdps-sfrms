import { defineConfig } from 'drizzle-kit';

import env from './server/lib/env';

export default defineConfig({
  schema: './server/db/schema',
  out: './server/db/migrations',
  dialect: 'mysql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
