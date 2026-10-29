import z from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(50, "Name must be at most 50 characters long"),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(20, "Password must be at most 20 characters long"),
  tenantName: z
    .string()
    .trim()
    .min(1, "Tenant name is required")
    .max(20, "Tenant name must be at most 20 characters long"),
});

export type CreateUserInput = z.infer<typeof registerSchema>;
