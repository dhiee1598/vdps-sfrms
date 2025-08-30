import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.string(),
  DATABASE_URL: z.string(),
//   API_KEY: z.string().min(32).max(32),
});

export type EnvSchema = z.infer<typeof EnvSchema>;

// eslint-disable-next-line node/no-process-env
export default EnvSchema.parse(process.env);
