import { z } from 'zod';

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
});

const studentSchema = z.object({
  id: z.number().optional(),
  first_name: z.string().min(1),
  middle_name: z.string().nullable(),
  last_name: z.string().min(1),
  address: z.string().min(1),
  contact_number: z.string().min(1),
});

export { loginSchema, studentSchema };

export type Login = z.infer<typeof loginSchema>;
export type Student = z.infer<typeof studentSchema>;
