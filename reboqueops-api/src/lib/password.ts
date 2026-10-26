import { compare, hash } from "bcryptjs";

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string) => {
  return await hash(password, SALT_ROUNDS);
};

export const verifyPassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  return compare(password, hashedPassword);
};
