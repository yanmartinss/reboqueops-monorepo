import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/token.js";
import { getUserById } from "../services/auth.service.js";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Access denied" });

  const token = authHeader.split("Bearer ")[1];
  if (!token) return res.status(401).json({ error: "Access denied" });

  let userId: string;
  try {
    const decoded = verifyToken(token);
    if (!decoded.sub) return res.status(401).json({ error: "Access denied" });
    userId = decoded.sub;
  } catch {
    return res.status(401).json({ error: "Access denied" });
  }

  const user = await getUserById(userId);
  if (!user) return res.status(401).json({ error: "Access denied" });

  (req as any).userId = userId;
  return next();
};
