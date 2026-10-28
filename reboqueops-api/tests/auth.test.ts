import { beforeAll, beforeEach, describe, expect, test } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import jwt from "jsonwebtoken";

const user = {
  name: "Yan Martins de Sousa",
  email: "yanmartinsteste@gmail.com",
  password: "123456",
  tenantName: "Yan Car Reboque",
};

async function resetDb() {
  if (!process.env.DATABASE_URL?.includes("reboqueops_test")) {
    throw new Error("resetDb recused: DATABASE_URL is not a database test");
  }

  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
}

describe("POST /api/register", () => {
  beforeAll(async () => {
    await resetDb();
  });

  test("should register a user and return status 201", async () => {
    const response = await request(app).post("/api/register").send(user);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("token");
  });
});

describe("POST /api/login", () => {
  beforeAll(async () => {
    await resetDb();
    await request(app).post("/api/register").send(user);
  });

  test("should login and return status 200", async () => {
    const response = await request(app)
      .post("/api/login")
      .send({ email: user.email, password: user.password });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
  });

  test("should return 401 with wrong password", async () => {
    const response = await request(app)
      .post("/api/login")
      .send({ email: user.email, password: "wrong_password" });

    expect(response.status).toBe(401);
  });

  test("should return the same error as wrong password when email does not exist", async () => {
    const wrongEmail = await request(app)
      .post("/api/login")
      .send({ email: "wrong_email@gmail.com", password: user.password });

    const wrongPassword = await request(app)
      .post("/api/login")
      .send({ email: user.email, password: "wrong_password" });

    expect(wrongEmail.status).toBe(401);
    expect(wrongEmail.status).toBe(wrongPassword.status);
    expect(wrongEmail.body).toEqual(wrongPassword.body);
  });

  test("returns 422 if field email is empty", async () => {
    const response = await request(app)
      .post("/api/login")
      .send({ email: "", password: user.password });

    expect(response.status).toBe(422);
  });
});

describe("verify token", () => {
  beforeAll(async () => {
    await resetDb();
    await request(app).post("/api/register").send(user);
  });

  test("should return a token whose sub is the user id", async () => {
    const response = await request(app)
      .post("/api/login")
      .send({ email: user.email, password: user.password });

    const payload = jwt.verify(
      response.body.token,
      process.env.JWT_SECRET!,
    ) as jwt.JwtPayload;

    const dbUser = await prisma.user.findUniqueOrThrow({
      where: { email: user.email },
    });

    expect(payload.sub).toBe(dbUser.id);
  });
});

describe("GET /api/me", () => {
  let token: string;

  beforeEach(async () => {
    await resetDb();
    const response = await request(app).post("/api/register").send(user);
    expect(response.status).toBe(201);
    token = response.body.token;
  });

  test("should return 401 without token", async () => {
    const response = await request(app).get("/api/me");

    expect(response.status).toBe(401);
  });

  test("should return 401 with tampered token", async () => {
    const [header, , signature] = token.split(".");
    const fakePayload = Buffer.from(
      JSON.stringify({
        sub: "random-id",
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    ).toString("base64url");
    const tampered = `${header}.${fakePayload}.${signature}`;

    const response = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${tampered}`);

    expect(response.status).toBe(401);
  });

  test("should return 200 and the user with valid token", async () => {
    const response = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      user: {
        email: user.email,
        tenantName: user.tenantName,
      },
    });
    expect(response.body).not.toHaveProperty("passwordHash");
  });

  test("should return 401 when the user was deleted", async () => {
    await prisma.user.deleteMany({ where: { email: user.email } });

    const response = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(401);
  });
});
