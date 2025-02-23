import { Request, Response, NextFunction, Router } from "express";
import assert from "node:assert";
import jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";
import { getPublicUser, createNewUser, UserRepository } from "./users.js";

assert.ok(process.env.JWT_SECRET, "No JWT_SECRET provided");
const JWT_SECRET = process.env.JWT_SECRET;

/**
  Check for access token. If invalid, reject request.
 */
export function protectRoute(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.access_token;

  if (!token) {
    res.status(401).send({ message: "No access token" });
    return;
  }

  try {
    jwt.verify(token, JWT_SECRET);
  } catch (_) {
    res.status(401).send({ message: "Invalid token" });
    return;
  }

  next();
}

/** Prevent other users to modify user profiles that are not theirs */
export function protectUsersFromModification(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.cookies.access_token;
  const { username, uuid } = req.params;

  try {
    let decoded = jwt.verify(token, JWT_SECRET) as {
      username: string;
      id: string;
    };

    if (decoded.username !== username || decoded.id !== uuid) {
      res.status(403).send({ message: "Cannot modify other users data" });
      return;
    }
  } catch {
    res.status(401).send({ message: "Invalid token" });
    return;
  }

  next();
}

export const authRouter = Router();

/**
  Send a registration request

  Request:
  ```json
  {
    "username":
    "password":
  }
  ```

  Response:
  ```json
  {
    "id":
  }
  ```

  Error:
  ```json
  {
    "message":
  }
  ```
*/
authRouter.route("/register").post(async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username) throw new Error("No username provided");
    if (!password) throw new Error("No password provided");

    const userExists = UserRepository.findByUsername(username);
    if (!userExists) throw new Error("Username exists");

    let newUser = await createNewUser(username, password);
    await UserRepository.create(newUser);

    res.status(201).send({ id: newUser.id });
  } catch (err: unknown) {
    res.status(400).send({ message: (err as Error).message });
  }
});

/**
  Handle login request

  Request:
  ```json
  {
    "username":
    "password":
  }
  ```

  Response:
  ```json
  {
    "id":
    "username":
  }
  ```

  Error:
  ```json
  {
    "message":
  }
  ```
*/
authRouter.route("/login").post(async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await UserRepository.findByUsername(username);
    if (!user) throw new Error("Username not found");

    const passwordOk = await bcrypt.compare(password, user.password);
    if (!passwordOk) throw new Error("Incorrect password");

    const publicUser = getPublicUser(user);

    const token = jwt.sign(publicUser, JWT_SECRET, {
      expiresIn: "1h",
    });

    res
      .cookie("access_token", token, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 1000 * 60 * 60, // ms
      })
      .send(publicUser);
  } catch (err: unknown) {
    res.status(401).send({ message: (err as Error).message });
  }
});

/**
  End session

  Response:
  ```json
  {
    "message": "Logged out"
  }
```
*/
authRouter.route("/logout").post((_, res) => {
  res.clearCookie("access_token").send({ message: "Logged out" });
});
