import jwt from "jsonwebtoken";
import { AppError } from "../errors/AppError";

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error("JWT_SECRET environment variable is not set.");
}

export const signToken = (sub: string, expiresIn: number) => {
  return jwt.sign({ sub }, jwtSecret, { expiresIn });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, jwtSecret);
  } catch {
    throw new AppError("Unauthorized", 401);
  }
};
