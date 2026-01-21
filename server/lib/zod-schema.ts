import { z } from 'zod';

const loginSchema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long.' }),
});

const studentSchema = z.object({
  id: z.string().optional(),
  first_name: z.string().min(1),
  middle_name: z.string().nullable(),
  last_name: z.string().min(1),
  address: z.string().min(1),
  contact_number: z.string().min(1),
});

const sundriesSchema = z.object({
  id: z.number().int(),
  sundry_name: z.string(),
  sundry_description: z.string().nullable(),
  sundry_amount: z.string(),
  createdAt: z.string().nullable(),
});

const enrolledStudentSchema = z.object({
  id: z.number().int(),
  student_id: z.string(),
  first_name: z.string(),
  middle_name: z.string().nullable(),
  last_name: z.string(),
  address: z.string(),
  contact_number: z.string(),
  grade_level: z.string(),
  strand_name: z.string(),
  academic_year: z.string(),
  semester: z.string(),
  date_enrolled: z.date().nullable(),
  createdAt: z.date().nullable(),
});

const reportDataSchema = z.object({
  type: z.string(),
  from_date: z.string(),
  to_date: z.string(),
});

export {
  enrolledStudentSchema,
  loginSchema,
  reportDataSchema,
  studentSchema,
  sundriesSchema,
};

export type Login = z.infer<typeof loginSchema>;
export type Student = z.infer<typeof studentSchema>;
export type Sundries = z.infer<typeof sundriesSchema>;
export type EnrolledStudent = z.infer<typeof enrolledStudentSchema>;
