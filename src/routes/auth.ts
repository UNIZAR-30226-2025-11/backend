import { Router } from "express";
import jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";

import { JWT_SECRET } from "../config.js";

import {
    getPublicUser,
    createNewUser
} from "../models/User.js";

import { UserRepository } from "../repositories/userRepository.js";
import { LOGIN_API, LOGOUT_API, REGISTER_API } from "../api/restAPI.js";
import logger from "../config/logger.js";

const authRouter = Router();

authRouter.route(REGISTER_API).post(async (req, res) => {
    const { username, password } = req.body;

    logger.info(`[AUTH] Registering user ${username}`);
    try {
        if (!username) throw new Error("No username provided");
        if (!password) throw new Error("No password provided");

        const userExists = UserRepository.findByUsername(username);
        if (!userExists) throw new Error("Username exists");

        let newUser = await createNewUser(username, password);
        await UserRepository.create(newUser);

        logger.info(`[AUTH] User ${username} registered`);
        res.status(201).send({ id: newUser.id });
    } catch (err: unknown) {

        logger.error(`[AUTH] Error registering user.`);
        res.status(400).send({ message: (err as Error).message });
    }
});

authRouter.route(LOGIN_API).post(async (req, res) => {
    const { username, password } = req.body;

    logger.info(`[AUTH] Logging in user ${username}`);
    try {
        const user = await UserRepository.findByUsername(username);
        if (!user) throw new Error("Username not found");

        const passwordOk = await bcrypt.compare(password, user.password);
        if (!passwordOk) throw new Error("Incorrect password");

        const publicUser = getPublicUser(user);

        const token = jwt.sign(publicUser, JWT_SECRET, {
            expiresIn: "1h",
        });

        logger.info(`[AUTH] User ${username} logged in`);
        res
            .cookie("access_token", token, {
                httpOnly: true,
                sameSite: "strict",
                maxAge: 1000 * 60 * 60, // ms
            })
            .send(publicUser);
    } catch (err: unknown) {
        logger.error(`[AUTH] Error logging in user.`);
        res.status(401).send({ message: (err as Error).message });
    }
});

authRouter.route(LOGOUT_API).post((_, res) => {
    logger.info(`[AUTH] Logging out user`);
    res.clearCookie("access_token").send({ message: "Logged out" });
});

export { authRouter };
