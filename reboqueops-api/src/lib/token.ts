import jwt from "jsonwebtoken";
import { AppError } from "../errors/AppError.js";

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error("JWT_SECRET environment variable is not set.");

const JWT_ALGORITHM: jwt.Algorithm = "HS256";

export type TokenPayload = { sub: string; exp: number };

export const signToken = (userId: string) => {
  return jwt.sign({ sub: userId }, jwtSecret, {
    algorithm: JWT_ALGORITHM,
    expiresIn: "7d",
  });
};

export const verifyToken = (token: string): TokenPayload => {
  let decoded: string | jwt.JwtPayload;
  try {
    decoded = jwt.verify(token, jwtSecret, {
      algorithms: [JWT_ALGORITHM],
    });
  } catch {
    throw new AppError("Invalid token", 401);
  }
  if (
    typeof decoded === "string" ||
    typeof decoded.sub !== "string" ||
    typeof decoded.exp !== "number"
  ) {
    throw new AppError("Invalid token", 401);
  }
  return { sub: decoded.sub, exp: decoded.exp };
};
