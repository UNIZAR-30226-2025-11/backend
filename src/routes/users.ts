import { Router } from "express";

import {
    protectRoute
} from "../middleware/auth.js";
import { UserRepository } from "../repositories/userRepository.js";
import { getPublicUser, getUserData, UserEntity } from "../models/User.js";
import { filterNonModifiableUserData } from "../middleware/users.js";
import { AllUsersData, USERS_API, USER_API, UserJSON } from "../api/restAPI.js";
import logger from "../config/logger.js";

const usersRouter = Router();
usersRouter.use(protectRoute);

usersRouter
    .route(USER_API)
    .get(async (req, res) => {
        logger.info(`[USERS] Getting specific user ${req.body.username}`);

        const response: UserJSON | undefined = await getUserData(req.body.username);

        if (response === undefined) {
            logger.warn(`[USERS] User ${req.body.username} not found`);
            res.status(404).send({ message: "User not found" });
            return;
        }
        logger.info(`[USERS] User ${req.body.username} found`);
        logger.debug(`[USERS] User ${req.body.username} data: ${JSON.stringify(response)}`);
        res.status(200).send(response);
        
    })
    .put(
        filterNonModifiableUserData,
        async (req, res) => {
            logger.info(`[USERS] Updating user ${req.params.username}`);
            const username: string = req.body.username;
            const user: UserEntity|undefined = await UserRepository.findByUsername(username);

            if (user === undefined) {
                logger.warn(`[USERS] User ${username} not found`);
                res.status(404).send({ message: "User not found" });
                return;
            }

            const data: Partial<UserEntity> = req.body;
            if (Object.keys(data).length === 0) {
                logger.warn(`[USERS] No data provided`);
                res.status(400).send({ message: "No data provided" });
                return;
            }

            try {
                await UserRepository.update(user.id, data);
                logger.info(`[USERS] Updating user ${username}`);
                res.status(200).send(getPublicUser({ ...user, ...data }));
            } catch (err: unknown) {
                logger.error(`[USERS] Error updating user ${username}`);
                res.status(404).send({ message: (err as Error).message });
            }
        },
    )
    .delete(async (req, res) => {
        const username: string = req.body.username;
        logger.info(`[USERS] Deleting user ${username}.`);

        const user: UserEntity|undefined = await UserRepository.findByUsername(username);

        if (user === undefined) {
            logger.warn(`[USERS] User ${username} not found`);
            res.status(404).send({ message: "User not found" });
            return;
        }

        try {
            await UserRepository.delete(user.id);
            logger.info(`[USERS] User ${username} deleted`);
            logger.info(`[USERS] Delete access token from cookies`);
            res.clearCookie("access_token").status(200).send({ message: "Deleted account" });
            return;
        } catch (err: unknown) {
            logger.error(`[USERS] Error deleting user ${username}`);
            res.status(404).send({ message: (err as Error).message });
        }
    });

usersRouter
    .route(USERS_API)
    .get(async (req, res) => {

        logger.info(`[USERS] Getting all users`);

        const username: string = req.body.username;

        const response: AllUsersData[] = await UserRepository.getAllUsersData(username);
        res.status(200).json(response);
    })
    .post((_req, res) => {
        res.status(501).send();
    });


export { usersRouter };
