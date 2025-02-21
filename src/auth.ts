import { Request, Response, NextFunction, Router } from "express";
import assert from "node:assert";
import jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";
import { UserRepository } from "./users.js";
import { Socket } from "socket.io";

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

export function protectSocket(socket: Socket, next: (err?: Error) => void) {
  const cookieHeader = socket.handshake.headers.cookie;

  if (!cookieHeader) {
    return next(new Error("No cookies found"));
  }

  // Parse cookies
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((cookie) => cookie.trim().split("=")),
  );

  const token = cookies["access_token"]; // Get the access_token cookie

  if (!token) {
    next(new Error("No access token"));
    return;
  }

  try {
    jwt.verify(token, JWT_SECRET);
  } catch (_) {
    next(new Error("Invalid token"));
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

    let id = crypto.randomUUID();
    let hashedPw = await bcrypt.hash(password, 10);

    await UserRepository.create({
      id,
      username,
      password: hashedPw,
    });

    res.status(201).send({ id });
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

    const { password: _, ...publicUser } = user;

    const token = jwt.sign(user, JWT_SECRET, {
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
