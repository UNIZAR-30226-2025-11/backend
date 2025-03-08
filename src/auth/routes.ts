import { Router } from "express";
import jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";

import { JWT_SECRET } from "../config.js";

import {
  getPublicUser,
  createNewUser,
  UserRepository,
} from "../users/model.js";

const authRouter = Router();

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

authRouter.route("/logout").post((_, res) => {
  res.clearCookie("access_token").send({ message: "Logged out" });
});

export { authRouter };
