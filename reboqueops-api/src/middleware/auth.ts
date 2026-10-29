import { NextFunction, Request, Response } from "express";
import { verifyToken, signToken } from "../lib/token.js";
import { getUserById } from "../services/auth.service.js";
import { AppError } from "../errors/AppError.js";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new AppError("Access denied", 401);

  const token = authHeader.split("Bearer ")[1];
  if (!token) throw new AppError("Access denied", 401);

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    throw new AppError("Access denied", 401);
  }
  if (!decoded.sub) throw new AppError("Access denied", 401);

  const user = await getUserById(decoded.sub);

  if (!user) throw new AppError("Access denied", 401);

  (req as any).userId = user.id;
  (req as any).tenantId = user.tenantId;

  if (decoded.rememberMe)
    res.setHeader("X-Refreshed-Token", signToken(user.id, decoded.rememberMe));

  return next();
};
