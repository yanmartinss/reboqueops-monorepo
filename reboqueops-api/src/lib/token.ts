import jwt from "jsonwebtoken";
import { AppError } from "../errors/AppError.js";

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error("JWT_SECRET environment variable is not set.");

const JWT_ALGORITHM: jwt.Algorithm = "HS256";

export type TokenPayload = { sub: string; exp: number; rememberMe: boolean };

export const signToken = (userId: string, rememberMe: boolean) => {
  return jwt.sign({ sub: userId, rememberMe }, jwtSecret, {
    algorithm: JWT_ALGORITHM,
    expiresIn: rememberMe ? "7d" : "2h",
  });
};

export const verifyToken = (token: string): TokenPayload => {
  let decoded: string | jwt.JwtPayload;
  decoded = jwt.verify(token, jwtSecret, {
    algorithms: [JWT_ALGORITHM],
  });

  if (
    typeof decoded === "string" ||
    typeof decoded.sub !== "string" ||
    typeof decoded.exp !== "number" ||
    typeof decoded.rememberMe !== "boolean"
  ) {
    throw new AppError("Access denied", 401);
  }
  return { sub: decoded.sub, exp: decoded.exp, rememberMe: decoded.rememberMe };
};
