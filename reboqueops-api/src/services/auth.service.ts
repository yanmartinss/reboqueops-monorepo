import { Prisma } from "../generated/prisma/client.js";
import { AppError } from "../errors/AppError.js";
import { hashPassword } from "../lib/password.js";
import { prisma } from "../lib/prisma.js";

export const createUser = async (userData: {
  name: string;
  email: string;
  password: string;
  tenantName: string;
}) => {
  const { name, email, password, tenantName } = userData;
  const hashedPassword = await hashPassword(password);

  try {
    return await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        tenant: { create: { name: tenantName } },
      },
      select: {
        id: true,
        name: true,
        email: true,
        tenant: { select: { id: true, name: true } },
      },
    });
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
