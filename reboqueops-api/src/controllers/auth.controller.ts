import { RequestHandler } from "express";
import { registerSchema } from "../schemas/register-schema.js";
import { AppError } from "../errors/AppError.js";
import * as authService from "../services/auth.service.js";
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
  if (!userId) return res.status(401).json({ error: "Access denied" });
  const user = await getUserById(userId);

  if (!user) return res.status(404).json({ error: "User not found" });
  return res.status(200).json({ user });
};
