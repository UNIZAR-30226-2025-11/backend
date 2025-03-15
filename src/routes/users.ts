import { Router } from "express";
import crypto from "node:crypto";

import {
  protectRoute,
  protectUsersFromModification
} from "../middleware/auth.js";
import { UserRepository } from "../repositories/userRepository.js";
import { getPublicUser, UserEntity } from "../models/User.js";
import { filterNonModifiableUserData } from "../middleware/users.js";
import { USERS_API, ID_API } from "../api/restAPI.js";

const usersRouter = Router();
usersRouter.use(protectRoute);

usersRouter
  .route(USERS_API)
  .get(async (_req, res) => {
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
    let { username } = req.params;
    let user = await UserRepository.findByUsername(username);

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
      let { username } = req.params;
      let user = await UserRepository.findByUsername(username);

      if (!user) {
        res.status(404).send({ message: "User not found" });
        return;
      }

      let data: Partial<UserEntity> = req.body;
      if (Object.keys(data).length === 0) {
        res.status(400).send({ message: "No data provided" });
        return;
      }

      try {
        await UserRepository.update(user.id, data);
        res.status(200).send(getPublicUser({ ...user, ...data }));
      } catch (err: unknown) {
        res.status(400).send({ message: (err as Error).message });
      }
    },
  )
  .delete(protectUsersFromModification, async (req, res) => {
    let { username } = req.params;
    let user = await UserRepository.findByUsername(username);

    if (!user) {
      res.status(404).send({ message: "User not found" });
      return;
    }

    try {
      await UserRepository.delete(user.id);
      res.status(200).send({});
    } catch (err: unknown) {
      res.status(400).send({ message: (err as Error).message });
    }
  });

usersRouter
  .route(USERS_API + ID_API + "/:uuid")
  .get(async (req, res) => {
    let { uuid } = req.params;
    let user = await UserRepository.findById(uuid as crypto.UUID);

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
      let { uuid } = req.params;
      let user = await UserRepository.findById(uuid as crypto.UUID);

      if (!user) {
        res.status(404).send({ message: "User not found" });
        return;
      }

      let data: Partial<UserEntity> = req.body;
      if (Object.keys(data).length === 0) {
        res.status(400).send({ message: "No data provided" });
        return;
      }

      try {
        await UserRepository.update(user.id, data);
        res.status(200).send(getPublicUser({ ...user, ...data }));
      } catch (err: unknown) {
        res.status(400).send({ message: (err as Error).message });
      }
    },
  )
  .delete(protectUsersFromModification, async (req, res) => {
    let { uuid } = req.params;
    let user = await UserRepository.findById(uuid as crypto.UUID);

    if (!user) {
      res.status(404).send({ message: "User not found" });
      return;
    }

    try {
      await UserRepository.delete(user.id);
      res.status(200).send({});
    } catch (err: unknown) {
      res.status(400).send({ message: (err as Error).message });
    }
  });

export { usersRouter };
