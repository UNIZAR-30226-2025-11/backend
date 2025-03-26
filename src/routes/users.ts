import { Router } from "express";
import crypto from "node:crypto";

import {
    protectRoute,
    protectUsersFromModification
} from "../middleware/auth.js";
import { UserRepository } from "../repositories/userRepository.js";
import { getPublicUser, UserEntity } from "../models/User.js";
import { filterNonModifiableUserData } from "../middleware/users.js";
import { USERS_API, ID_API, USER_API } from "../api/restAPI.js";
import logger from "../config/logger.js";

const usersRouter = Router();
usersRouter.use(protectRoute);

usersRouter
    .route(USER_API)
    .get(async (req, res) => {
        logger.info(`[USERS] Getting specific user ${req.body.username}`);
        const user = await UserRepository.findByUsername(req.body.username);
        if (!user) {
            res.status(404).send({ message: "User not found" });
            return;
        }
        res.status(200).send(getPublicUser(user));
    })
usersRouter
    .route(USERS_API)
    .get(async (_req, res) => {
        logger.info(`[USERS] Getting all users`);
        res
            .status(200)
            .send(
                (await UserRepository.findAll()).map((user) => getPublicUser(user)),
            );
    })
    .post((_req, res) => {
        res.status(501).send();
    });

usersRouter
    .route( USERS_API + "/:username")
    .get(async (req, res) => {
        logger.info(`[USERS] Getting user ${req.params.username}`);
        const { username } = req.params;
        const user = await UserRepository.findByUsername(username);

        if (!user) {
            res.status(404).send({ message: "User not found" });
            return;
        }

        res.status(200).send(getPublicUser(user));
    })
    .put(
        protectUsersFromModification,
        filterNonModifiableUserData,
        async (req, res) => {
            logger.info(`[USERS] Updating user ${req.params.username}`);
            const { username } = req.params;
            const user = await UserRepository.findByUsername(username);

            if (!user) {
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
                res.status(400).send({ message: (err as Error).message });
            }
        },
    )
    .delete(protectUsersFromModification, async (req, res) => {
        logger.info(`[USERS] Deleting user ${req.params.username}`);
        const { username } = req.params;
        const user = await UserRepository.findByUsername(username);

        if (!user) {
            logger.warn(`[USERS] User ${username} not found`);
            res.status(404).send({ message: "User not found" });
            return;
        }

        try {
            await UserRepository.delete(user.id);
            logger.info(`[USERS] User ${username} deleted`);
            res.status(200).send({});
        } catch (err: unknown) {
            logger.error(`[USERS] Error deleting user ${username}`);
            res.status(400).send({ message: (err as Error).message });
        }
    });

usersRouter
    .route(USERS_API + ID_API + "/:uuid")
    .get(async (req, res) => {
        logger.info(`[USERS] Getting user ${req.params.uuid}`);
        const{ uuid } = req.params;
        const user = await UserRepository.findById(uuid as crypto.UUID);

        if (!user) {
            logger.warn(`[USERS] User ${uuid} not found`);
            res.status(404).send({ message: "User not found" });
            return;
        }

        logger.info(`[USERS] User ${uuid} found`);
        res.status(200).send(getPublicUser(user));
    })
    .put(
        protectUsersFromModification,
        filterNonModifiableUserData,
        async (req, res) => {
            logger.info(`[USERS] Updating user ${req.params.uuid}`);
            const { uuid } = req.params;
            const user = await UserRepository.findById(uuid as crypto.UUID);

            if (!user) {
                logger.warn(`[USERS] User ${uuid} not found`);
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
                logger.info(`[USERS] User ${uuid} updated`);
                res.status(200).send(getPublicUser({ ...user, ...data }));
            } catch (err: unknown) {
                logger.warn(`[USERS] Error updating user ${uuid}`);
                res.status(400).send({ message: (err as Error).message });
            }
        },
    )
    .delete(protectUsersFromModification, async (req, res) => {
        logger.info(`[USERS] Deleting user ${req.params.uuid}`);
        const { uuid } = req.params;
        const user = await UserRepository.findById(uuid as crypto.UUID);

        if (!user) {
            logger.warn(`[USERS] User ${uuid} not found`);
            res.status(404).send({ message: "User not found" });
            return;
        }

        try {
            await UserRepository.delete(user.id);
            logger.info(`[USERS] User ${uuid} deleted`);
            res.status(200).send({});
        } catch (err: unknown) {
            logger.warn(`[USERS] Error deleting user ${uuid}`);
            res.status(400).send({ message: (err as Error).message });
        }
    });

export { usersRouter };
