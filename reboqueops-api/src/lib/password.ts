import { hash } from "bcryptjs";

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string) => {
  const hashedPassword = await hash(password, SALT_ROUNDS);
  return hashedPassword;
};
