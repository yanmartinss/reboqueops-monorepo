import { Prisma } from "../generated/prisma/client.js";
import { AppError } from "../errors/AppError.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
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

export const loginUser = async (loginData: {
  email: string;
  password: string;
}) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: loginData.email },
  });
  if (!existingUser) {
    await hashPassword(loginData.password); // Prevent timing attacks, making with the password and user error have the same time
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await verifyPassword(
    loginData.password,
    existingUser.passwordHash,
  );
  if (!isPasswordValid) throw new AppError("Invalid email or password", 401);

  const token = signToken(existingUser.id);
  return { token };
};
