import { z } from 'zod';

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
});

const studentSchema = z.object({
  id: z.string().optional(),
  first_name: z.string().min(1),
  middle_name: z.string().nullable(),
  last_name: z.string().min(1),
  address: z.string().min(1),
  contact_number: z.string().min(1),
});

const feeSchema = z.object({
  id: z.number().int(),
  fee_name: z.string().min(1, 'Fee name is required'),
  fee_description: z.string().nullable(),
  createdAt: z.string().nullable(),
});

const assessmentFeeSchema = z.object({
  id: z.number().int(),
  fee_id: z.number().int(),
  fee_name: z.string(),
  amount: z.string(),
});

const assessmentSchema = z.object({
  id: z.int().optional(),
  enrollment_id: z.number().int().nullable(),
  student_id: z.string(),
  fees: z.array(assessmentFeeSchema),
  total_fees: z.number().positive(),
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

export { assessmentSchema, enrolledStudentSchema, loginSchema, reportDataSchema, studentSchema, sundriesSchema, feeSchema };

export type Login = z.infer<typeof loginSchema>;
export type Student = z.infer<typeof studentSchema>;
export type Assessment = z.infer<typeof assessmentSchema>;
export type AssessmentFee = z.infer<typeof assessmentFeeSchema>;
export type Fees = z.infer<typeof feeSchema>;
export type Sundries = z.infer<typeof sundriesSchema>;
export type EnrolledStudent = z.infer<typeof enrolledStudentSchema>;
