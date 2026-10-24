import { RequestHandler } from "express";
import { registerSchema } from "../schemas/register-schema.js";
import { AppError } from "../errors/AppError.js";
import * as authService from "../services/auth.service.js";

export const register: RequestHandler = async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) throw new AppError("Invalid input data", 422);

  const response = await authService.createUser(result.data);
  return res.status(201).json({ token: response.token });
};
