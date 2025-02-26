import { afterAll, beforeAll, describe, it } from "vitest";

describe("User routes", () => {
  // Create new test users and log in
  beforeAll(() => {});

  // Remove all test users and log out
  afterAll(() => {});

  describe("GET /users", () => {
    it("Returns all users in the database", () => {});
  });

  describe("GET /user/:username", () => {
    it("Returns 200 OK and user if found", () => {});

    it("Returns 404 Not Found if user not found", () => {});
  });

  describe("PUT/user/:username", () => {
    it("Returns 200 OK and user if modified", () => {});

    it("Returns 400 Bad Request if no data is provided", () => {});

    it("Returns 404 Not Found if user not found", () => {});
  });

  describe("DELETE /user/:username", () => {
    it("Returns 200 OK if user is deleted", () => {});

    it("Returns 404 Not Found if user not found", () => {});
  });

  it("PUT and DELETE send 403 Forbidden if wrong user tries to modify data", () => {});
});
