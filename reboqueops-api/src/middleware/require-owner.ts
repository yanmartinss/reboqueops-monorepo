import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.js";

export const requireOwner = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.role !== "OWNER") throw new AppError("Permission denied", 403);

  next();
};
