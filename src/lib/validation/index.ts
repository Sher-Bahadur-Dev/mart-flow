import { z } from "zod";

import { ASSIGNABLE_ROLES, ROLES } from "@/lib/permissions";

export const requiredString = (label: string, min = 1) =>
  z.string().trim().min(min, `${label} is required.`);

export const LoginSchema = z.object({
  email: z.email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

export const RegisterSchema = z
  .object({
    name: requiredString("Full name", 2),
    email: z.email("Enter a valid email."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const ForgotPasswordSchema = z.object({
  email: z.email("Enter a valid email."),
});

const optionalText = z.string().trim().optional();

export const EmployeeCreateSchema = z.object({
  name: requiredString("Full name", 2),
  email: z.email("Enter a valid email."),
  phone: requiredString("Phone"),
  employeeCode: requiredString("Employee code"),
  jobTitle: requiredString("Job title"),
  role: z.enum(ASSIGNABLE_ROLES),
  storeId: requiredString("Store"),
  hireDate: requiredString("Hire date"),
  salary: z.string().trim().optional(),
  isActive: z.enum(["true", "false"]),
  address: optionalText,
  emergencyContact: optionalText,
});

export const EmployeeUpdateSchema = z.object({
  name: requiredString("Full name", 2),
  email: z.email("Enter a valid email."),
  phone: requiredString("Phone"),
  employeeCode: requiredString("Employee code"),
  jobTitle: requiredString("Job title"),
  role: z.enum(ROLES),
  storeId: requiredString("Store"),
  hireDate: requiredString("Hire date"),
  salary: z.string().trim().optional(),
  isActive: z.enum(["true", "false"]),
  address: optionalText,
  emergencyContact: optionalText,
});
