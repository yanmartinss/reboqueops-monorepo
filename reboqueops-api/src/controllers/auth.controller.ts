import { RequestHandler } from "express";
import { registerSchema } from "../schemas/register-schema.js";
import { AppError } from "../errors/AppError.js";
import * as authService from "../services/auth.service.js";
import { loginSchema } from "../schemas/login-schema.js";

export const register: RequestHandler = async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) throw new AppError("Invalid input data", 422);

  const response = await authService.createUser(result.data);
  return res.status(201).json({ token: response.token });
};

export const login: RequestHandler = async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) throw new AppError("Invalid input data", 422);

  const response = await authService.loginUser(result.data);
  return res.status(200).json({ token: response.token });
};
