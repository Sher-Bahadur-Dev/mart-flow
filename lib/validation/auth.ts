import { z } from "zod";

import { USERNAME_SCHEMA } from "@/lib/validation/employees";

export const LoginSchema = z.object({
  identifier: z.string().trim().min(1, "Email or username is required."),
  password: z.string().min(1, "Password is required."),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export type LoginFormState = {
  error?: string;
};

export const SignupSchema = z
  .object({
    storeName: z.string().trim().min(2, "Store name is required."),
    name: z.string().trim().min(1, "Your name is required."),
    email: z.email("Enter a valid email."),
    username: USERNAME_SCHEMA,
    phone: z.string().trim().optional(),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof SignupSchema>;

export const GoogleSignupSchema = z.object({
  idToken: z.string().trim().min(1, "Google sign-in did not complete."),
  storeName: z.string().trim().min(2, "Store name is required."),
  name: z.string().trim().optional(),
  username: USERNAME_SCHEMA,
  phone: z.string().trim().optional(),
});
