import { RequestHandler } from "express";
import { registerSchema } from "../schemas/register-schema.js";
import { AppError } from "../errors/AppError.js";
import { loginSchema } from "../schemas/login-schema.js";
import {
  getUserById,
  loginUser,
  createUser,
} from "../services/auth.service.js";

export const register: RequestHandler = async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) throw new AppError("Invalid input data", 422);

  const response = await createUser(result.data);
  return res.status(201).json({ token: response.token });
};

export const login: RequestHandler = async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) throw new AppError("Invalid input data", 422);

  const response = await loginUser(result.data);
  return res.status(200).json({ token: response.token });
};

export const getMe: RequestHandler = async (req, res) => {
  const userId = (req as any).userId;
  if (!userId) throw new AppError("Access denied", 401);
  const user = await getUserById(userId);

  if (!user) throw new AppError("User not found", 404);
  return res.status(200).json({ user });
};
