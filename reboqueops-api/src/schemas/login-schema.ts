import z from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1),
  rememberMe: z.boolean(),
});

export type LoginUserSchema = z.infer<typeof loginSchema>;
