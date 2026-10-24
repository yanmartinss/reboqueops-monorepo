import { Prisma } from "../generated/prisma/client.js";
import { AppError } from "../errors/AppError.js";
import { hashPassword } from "../lib/password.js";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../lib/token.js";

export const createUser = async (userData: {
  name: string;
  email: string;
  password: string;
  tenantName: string;
}) => {
  const { name, email, password, tenantName } = userData;
  const hashedPassword = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        tenant: { create: { name: tenantName } },
      },
    });
    const token = signToken(user.id);
    return { token };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError("Email already exists", 409);
    }
    throw error;
  }
};
