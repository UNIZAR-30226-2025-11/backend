import request from "supertest";
import { describe, expect, it } from "vitest";

import { app as server } from "../src/app.js";

// TODO: Remove
describe("GET /hello", () => {
  it(`should return "Hello world"`, async () => {
    const response = await request(server).get("/hello");

    expect(response.status).toBe(200);
    expect(response.text).toBe("Hello world!");
  });
});
