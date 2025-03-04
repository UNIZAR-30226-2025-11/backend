import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import crypto from "node:crypto";

import { app as server } from "../src/app.js";
import { createNewUser, UserRepository } from "../src/users/model.js";

describe("Auth routes", () => {
  let testAccessToken: string | undefined = undefined;

  describe("POST /register", () => {
    let testUserId: crypto.UUID | undefined = undefined;

    // Remove "testuser" if already in database
    beforeAll(async () => {
      const testUser = await UserRepository.findByUsername("testuser");

      if (testUser) await UserRepository.delete(testUser.id);
    });

    // Remove "testuser" created by 200 call
    afterAll(async () => {
      if (testUserId) await UserRepository.delete(testUserId);
    });

    it("Should return 400 if no username", async () => {
      const response = await request(server)
        .post("/register")
        .send({ password: "super-secret-password" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("No username provided");
    });

    it("Should return 400 if no password", async () => {
      const response = await request(server)
        .post("/register")
        .send({ username: "testuser" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("No password provided");
    });

    it("Should return 200 if OK", async () => {
      const response = await request(server)
        .post("/register")
        .send({ username: "testuser", password: "super-secret-password" });

      expect(response.status).toBe(201);
      testUserId = response.body.id;
    });

    it("Should return 400 if username exists", async () => {
      const response = await request(server)
        .post("/register")
        .send({ username: "testuser", password: "super-secret-password" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("User exists");
    });
  });

  describe("POST /login", () => {
    let testUserId: crypto.UUID | undefined = undefined;

    beforeAll(async () => {
      let testUser = await UserRepository.findByUsername("testuser");

      // Add test user for this test set
      if (testUser) {
        await UserRepository.delete(testUser.id);
      } else {
        const newUser = await createNewUser(
          "testuser",
          "super-secret-password",
        );

        await UserRepository.create(newUser);
        testUserId = newUser.id;
      }
    });

    // Clean up
    afterAll(async () => {
      if (testUserId) await UserRepository.delete(testUserId);
    });

    it("Should return 401 if username not found", async () => {
      const response = await request(server).post("/login").send({
        username: "not-a-valid-user",
        password: "super-secret-password",
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Username not found");
    });

    it("Should return 401 if username not found", async () => {
      const response = await request(server).post("/login").send({
        username: "testuser",
        password: "wrong-passport",
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Incorrect password");
    });

    it("Should return 200 if OK", async () => {
      const response = await request(server)
        .post("/login")
        .send({ username: "testuser", password: "super-secret-password" });

      expect(response.status).toBe(200);

      expect(response.body.username).toBe("testuser");
      expect(response.body.id).toBe(testUserId);

      // Check for access token in cookies
      expect(response.headers["set-cookie"]).toBeDefined();
      expect(response.headers["set-cookie"][0]).toMatch(/^access_token=/);
      testAccessToken = response.headers["set-cookie"][0];
    });
  });

  describe("Accessing protected routes", () => {
    // TODO: Replace with any other route down the line
    it("Should NOT be able to access a protected route without the access token", async () => {
      const response = await request(server).get("/users");

      expect(response.status).toBe(401);
    });

    it("Should be able to access a protected route using the access token", async () => {
      const response = await request(server)
        .get("/users")
        .set("Cookie", testAccessToken!);

      expect(response.status).toBe(200);
    });
  });

  describe("POST /logout", () => {
    it("Should return 200", async () => {
      const response = await request(server)
        .post("/logout")
        .set("Cookie", testAccessToken!);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Logged out");

      // It should also clear the cookie
      expect(response.headers["set-cookie"]).toBeDefined();
      expect(response.headers["set-cookie"][0]).toMatch(/^access_token=/);
      expect(response.headers["set-cookie"][0]).toContain("Expires=");
      expect(response.headers["set-cookie"][0]).toContain(
        "Thu, 01 Jan 1970 00:00:00 GMT",
      );
    });
  });
});
