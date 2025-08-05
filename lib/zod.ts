import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().nonempty("Email is required").email("Invalid email address"),
  password: z
    .string()
    .nonempty("Password is required")
    .min(4, "Password must be at least 4 characters")
    .max(32, "Password must be less than 32 characters"),
});

// Export inferred type for better type safety
export type SignInSchema = z.infer<typeof signInSchema>;