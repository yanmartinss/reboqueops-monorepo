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
  rememberMe: true,
};

async function resetDb() {
  if (!process.env.DATABASE_URL?.includes("reboqueops_test")) {
    throw new Error("resetDb recused: DATABASE_URL is not a database test");
  }

  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
}

describe("POST /api/register", () => {
  beforeEach(async () => {
    await resetDb();
  });

  test("should register a user and return status 201", async () => {
    const response = await request(app).post("/api/register").send(user);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("token");
  });

  test("should register without rememberMe", async () => {
    const { rememberMe, ...withoutRememberMe } = user;

    const response = await request(app)
      .post("/api/register")
      .send(withoutRememberMe);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("token");
  });

  test("should return 409 when email is already registered", async () => {
    await request(app).post("/api/register").send(user);

    const response = await request(app).post("/api/register").send(user);

    expect(response.status).toBe(409);
  });

  test("should not store the password in plain text", async () => {
    await request(app).post("/api/register").send(user);

    const dbUser = await prisma.user.findUniqueOrThrow({
      where: { email: user.email },
    });

    expect(dbUser.passwordHash).not.toBe(user.password);
  });

  test("returns 422 if field email is invalid", async () => {
    const response = await request(app)
      .post("/api/register")
      .send({ ...user, email: "not-an-email" });

    expect(response.status).toBe(422);
  });

  test("returns 422 if field tenantName is missing", async () => {
    const { tenantName, ...withoutTenant } = user;

    const response = await request(app)
      .post("/api/register")
      .send(withoutTenant);

    expect(response.status).toBe(422);
  });

  test("returns 422 if field password is empty", async () => {
    const response = await request(app)
      .post("/api/register")
      .send({ ...user, password: "" });

    expect(response.status).toBe(422);
  });
});

describe("POST /api/login", () => {
  beforeAll(async () => {
    await resetDb();
    await request(app).post("/api/register").send(user);
  });

  test("should login and return status 200", async () => {
    const response = await request(app).post("/api/login").send({
      email: user.email,
      password: user.password,
      rememberMe: user.rememberMe,
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
  });

  test("returns 422 if field rememberMe is missing", async () => {
    const response = await request(app).post("/api/login").send({
      email: user.email,
      password: user.password,
    });

    expect(response.status).toBe(422);
  });

  test("should login with rememberMe false and return status 200", async () => {
    const response = await request(app).post("/api/login").send({
      email: user.email,
      password: user.password,
      rememberMe: false,
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
  });

  test("token with rememberMe false should expire before token with rememberMe true", async () => {
    const withRemember = await request(app).post("/api/login").send({
      email: user.email,
      password: user.password,
      rememberMe: true,
    });

    const withoutRemember = await request(app).post("/api/login").send({
      email: user.email,
      password: user.password,
      rememberMe: false,
    });

    const longPayload = jwt.verify(
      withRemember.body.token,
      process.env.JWT_SECRET!,
    ) as jwt.JwtPayload;

    const shortPayload = jwt.verify(
      withoutRemember.body.token,
      process.env.JWT_SECRET!,
    ) as jwt.JwtPayload;

    expect(shortPayload.exp).toBeDefined();
    expect(longPayload.exp).toBeDefined();
    expect(shortPayload.exp!).toBeLessThan(longPayload.exp!);
  });

  test("should return 401 with wrong password", async () => {
    const response = await request(app).post("/api/login").send({
      email: user.email,
      password: "wrong_password",
      rememberMe: user.rememberMe,
    });

    expect(response.status).toBe(401);
  });

  test("should return the same error as wrong password when email does not exist", async () => {
    const wrongEmail = await request(app).post("/api/login").send({
      email: "wrong_email@gmail.com",
      password: user.password,
      rememberMe: user.rememberMe,
    });

    const wrongPassword = await request(app).post("/api/login").send({
      email: user.email,
      password: "wrong_password",
      rememberMe: user.rememberMe,
    });

    expect(wrongEmail.status).toBe(401);
    expect(wrongEmail.status).toBe(wrongPassword.status);
    expect(wrongEmail.body).toEqual(wrongPassword.body);
  });

  test("returns 422 if field email is empty", async () => {
    const response = await request(app).post("/api/login").send({
      email: "",
      password: user.password,
      rememberMe: user.rememberMe,
    });

    expect(response.status).toBe(422);
  });

  test("returns 422 if field password is empty", async () => {
    const response = await request(app).post("/api/login").send({
      email: user.email,
      password: "",
      rememberMe: user.rememberMe,
    });

    expect(response.status).toBe(422);
  });

  test("returns 422 if body is empty", async () => {
    const response = await request(app).post("/api/login").send({});

    expect(response.status).toBe(422);
  });

  test("should not return passwordHash on login", async () => {
    const response = await request(app).post("/api/login").send({
      email: user.email,
      password: user.password,
      rememberMe: user.rememberMe,
    });

    expect(response.status).toBe(200);

    expect(JSON.stringify(response.body)).not.toContain("passwordHash");
  });
});

describe("verify token", () => {
  beforeAll(async () => {
    await resetDb();
    await request(app).post("/api/register").send(user);
  });

  test("should return a token whose sub is the user id", async () => {
    const response = await request(app).post("/api/login").send({
      email: user.email,
      password: user.password,
      rememberMe: user.rememberMe,
    });

    const payload = jwt.verify(
      response.body.token,
      process.env.JWT_SECRET!,
    ) as jwt.JwtPayload;

    const dbUser = await prisma.user.findUniqueOrThrow({
      where: { email: user.email },
    });

    expect(payload.sub).toBe(dbUser.id);
  });

  test("should return a token with an expiration", async () => {
    const response = await request(app).post("/api/login").send({
      email: user.email,
      password: user.password,
      rememberMe: user.rememberMe,
    });

    const payload = jwt.verify(
      response.body.token,
      process.env.JWT_SECRET!,
    ) as jwt.JwtPayload;

    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });
});

describe("rememberMe claim", () => {
  beforeAll(async () => {
    await resetDb();
    await request(app).post("/api/register").send(user);
  });

  async function loginPayload(rememberMe: boolean) {
    const response = await request(app).post("/api/login").send({
      email: user.email,
      password: user.password,
      rememberMe,
    });

    expect(response.status).toBe(200);

    return jwt.verify(
      response.body.token,
      process.env.JWT_SECRET!,
    ) as jwt.JwtPayload;
  }

  test("token with rememberMe false should last exactly 2 hours", async () => {
    const payload = await loginPayload(false);

    expect(payload.exp! - payload.iat!).toBe(2 * 60 * 60);
  });

  test("token with rememberMe true should last exactly 7 days", async () => {
    const payload = await loginPayload(true);

    expect(payload.exp! - payload.iat!).toBe(7 * 24 * 60 * 60);
  });

  test("token should carry rememberMe false in the payload", async () => {
    const payload = await loginPayload(false);

    expect(payload.rememberMe).toBe(false);
  });

  test("token should carry rememberMe true in the payload", async () => {
    const payload = await loginPayload(true);

    expect(payload.rememberMe).toBe(true);
  });

  test("should return 401 on /api/me with a valid token without the rememberMe claim", async () => {
    const dbUser = await prisma.user.findUniqueOrThrow({
      where: { email: user.email },
    });

    const withoutClaim = jwt.sign({ sub: dbUser.id }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    const response = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${withoutClaim}`);

    expect(response.status).toBe(401);
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

  test("should return 401 without Bearer prefix", async () => {
    const response = await request(app)
      .get("/api/me")
      .set("Authorization", token);

    expect(response.status).toBe(401);
  });

  test("should return 401 with malformed token", async () => {
    const response = await request(app)
      .get("/api/me")
      .set("Authorization", "Bearer not.a.jwt");

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

  test("should return 401 with token signed by another secret", async () => {
    const dbUser = await prisma.user.findUniqueOrThrow({
      where: { email: user.email },
    });

    const forged = jwt.sign({ sub: dbUser.id }, "another-secret", {
      expiresIn: "1h",
    });

    const response = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${forged}`);

    expect(response.status).toBe(401);
  });

  test("should return 401 with expired token", async () => {
    const dbUser = await prisma.user.findUniqueOrThrow({
      where: { email: user.email },
    });

    const expired = jwt.sign(
      { sub: dbUser.id, exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_SECRET!,
    );

    const response = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${expired}`);

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
    expect(response.body.user).not.toHaveProperty("passwordHash");
    expect(response.body.user).not.toHaveProperty("password");
  });

  test("should return 200 with token from login with rememberMe false", async () => {
    const login = await request(app).post("/api/login").send({
      email: user.email,
      password: user.password,
      rememberMe: false,
    });

    expect(login.status).toBe(200);

    const response = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${login.body.token}`);

    expect(response.status).toBe(200);
  });

  async function loginToken(rememberMe: boolean) {
    const response = await request(app).post("/api/login").send({
      email: user.email,
      password: user.password,
      rememberMe,
    });

    expect(response.status).toBe(200);
    return response.body.token as string;
  }

  test("should send x-refreshed-token when rememberMe is true", async () => {
    const loginTokenValue = await loginToken(true);

    const response = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${loginTokenValue}`);

    expect(response.status).toBe(200);
    expect(response.headers["x-refreshed-token"]).toBeDefined();
  });

  test("should not send x-refreshed-token when rememberMe is false", async () => {
    const loginTokenValue = await loginToken(false);

    const response = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${loginTokenValue}`);

    expect(response.status).toBe(200);
    expect(response.headers["x-refreshed-token"]).toBeUndefined();
  });

  test("refreshed token should be accepted by /api/me with same sub and rememberMe true", async () => {
    const loginTokenValue = await loginToken(true);

    const first = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${loginTokenValue}`);

    const refreshed = first.headers["x-refreshed-token"];
    expect(refreshed).toBeDefined();

    const loginPayload = jwt.verify(
      loginTokenValue,
      process.env.JWT_SECRET!,
    ) as jwt.JwtPayload;

    const refreshedPayload = jwt.verify(
      refreshed,
      process.env.JWT_SECRET!,
    ) as jwt.JwtPayload;

    expect(refreshedPayload.sub).toBe(loginPayload.sub);
    expect(refreshedPayload.rememberMe).toBe(true);

    const second = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${refreshed}`);

    expect(second.status).toBe(200);
  });

  test("should return 401 when the user was deleted", async () => {
    await prisma.user.deleteMany({ where: { email: user.email } });

    const response = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(401);
  });
});
