import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";

import {
  createNewUser,
  getPublicUser,
  UserRepository,
} from "../src/users/model";
import { app as server } from "../src/app.js";

describe("User routes", async () => {
  // Use an agent to keep session (i.e. cookies)
  let agent = request.agent(server);

  let users = [
    await createNewUser("test-subject-1", "safe-password-1"),
    await createNewUser("test-subject-2", "safe-password-2"),
    await createNewUser("test-subject-3", "safe-password-3"),
  ];

  let publicUsers = users.map((user) => getPublicUser(user));

  // Create new test users and log in
  beforeAll(async () => {
    for (let user of users) {
      await UserRepository.create(user);
    }

    const response = await agent
      .post("/login")
      .send({ username: "test-subject-1", password: "safe-password-1" });

    if (!response.headers["set-cookie"][0])
      throw new Error(
        "Something went wrong and the test was not able to start",
      );
  });

  // Remove all test users and log out
  afterAll(async () => {
    for (let user of users) {
      await UserRepository.delete(user.id);
    }

    await agent.post("/logout");
  });

  describe("GET /users", () => {
    it("Returns all users in the database", async () => {
      const response = await agent.get("/users");

      expect(response.status).toBe(200);
      expect(response.body).toContainEqual(publicUsers[0]);
      expect(response.body).toContainEqual(publicUsers[1]);
      expect(response.body).toContainEqual(publicUsers[2]);
    });
  });

  describe("GET /user/:username", () => {
    it("Returns 200 OK and user if found", async () => {
      const response = await agent.get("/users/test-subject-1");

      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual(publicUsers[0]);
    });

    it("Returns 404 Not Found if user not found", async () => {
      const response = await agent.get("/users/user-that-definitely-exists");

      expect(response.status).toBe(404);
    });
  });

  describe("PUT/user/:username", () => {
    it("Returns 200 OK and user if modified", async () => {
      const response = await agent
        .put("/users/test-subject-1")
        .send({ username: "cool-test-subject-1", games_won: 999 });

      expect(response.status).toBe(200);
      expect(response.body.username).toBe("cool-test-subject-1");
      // Also chech that some non-modifiable data is filtered
      expect(response.body.games_won).toBe(0);

      // Revert change
      await UserRepository.update(users[0].id, { username: "test-subject-1" });
    });

    it("Returns 400 Bad Request if no data is provided", async () => {
      const response = await agent.put("/users/test-subject-1");

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("No data provided");
    });
  });

  describe("DELETE /user/:username", () => {
    // Add the user back
    afterAll(async () => {
      UserRepository.create(users[0]);
    });

    it("Returns 200 OK if user is deleted", async () => {
      const response = await agent.delete("/users/test-subject-1");

      expect(response.status).toBe(200);
    });
  });

  describe("403 Forbidden if wrong user tries to modify data", () => {
    it("403 Forbidden for UPDATE", async () => {
      const response = await agent.put("/users/test-subject-3");

      expect(response.status).toBe(403);
    });
    it("403 Forbidden for DELETE", async () => {
      const response = await agent.put("/users/test-subject-3");

      expect(response.status).toBe(403);
    });
  });
});
