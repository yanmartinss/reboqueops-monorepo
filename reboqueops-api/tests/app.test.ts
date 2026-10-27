import { describe, expect, test } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";

describe("testing health endpoint", () => {
  test("should return pong true and status 200", async () => {
    const response = await request(app).get("/api/ping");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ pong: true });
  });
});
