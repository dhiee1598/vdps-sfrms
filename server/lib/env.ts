import { z } from 'zod';

import tryParseEnv from './try-parse-env';

const EnvSchema = z.object({
  NODE_ENV: z.string(),
  DATABASE_URL: z.url(),
  NUXT_SESSION_PASSWORD: z.string().max(32),
});

export type EnvSchema = z.infer<typeof EnvSchema>;

tryParseEnv(EnvSchema);

// eslint-disable-next-line node/no-process-env
export default EnvSchema.parse(process.env);
