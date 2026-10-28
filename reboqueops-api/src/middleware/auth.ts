import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/token.js";
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

  let userId: string;
  try {
    const decoded = verifyToken(token);
    if (!decoded.sub) throw new AppError("Access denied", 401);
    userId = decoded.sub;
  } catch {
    throw new AppError("Access denied", 401);
  }

  const user = await getUserById(userId);
  if (!user) throw new AppError("Access denied", 401);

  (req as any).userId = user.id;
  (req as any).tenantId = user.tenantId;
  return next();
};
