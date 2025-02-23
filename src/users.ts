import crypto from "node:crypto";
import bcrypt from "bcrypt";

import { db } from "./db.js";
import { Request, Router } from "express";

/** Data transfer type for user profiles */
export interface UserEntity {
  id: crypto.UUID;
  username: string;
  password: string;

  games_played: number;
  games_won: number;

  coins: number;
}

/** Create a brand new user */
export async function createNewUser(
  username: string,
  password: string,
): Promise<UserEntity> {
  return {
    id: crypto.randomUUID(),
    username,
    password: await bcrypt.hash(password, 10),

    games_played: 0,
    games_won: 0,

    coins: 0,
  };
}

/** Return user without sensitive data */
export function getPublicUser(user: UserEntity) {
  let { password: _, ...publicUser } = user;
  return publicUser;
}

export class User implements UserEntity {
  id = crypto.randomUUID();
  games_played = 0;
  games_won = 0;
  coins = 0;

  /** Create a brand-new user */
  constructor(
    public username: string,
    public password: string,
  ) {
    this.username = username;
    this.password = password;
  }

  publicUser = () => {
    const { password: _, ...publicUser } = this;
    return publicUser;
  };
}

/** Data access methods for user profiles */
export class UserRepository {
  /**
   * Create new user.
   *
   * NOTE: Password MUST be hashed BEFORE this method is called
   *
   * @returns An User has been created
   * @throws User already exists
   */
  static async create(user: UserEntity): Promise<boolean> {
    const QUERY = `INSERT INTO users(id, username, password) VALUES ($1, $2, $3)`;
    const idExists = await this.findById(user.id);
    const userExists = await this.findByUsername(user.username);

    if (idExists || userExists) throw new Error("User exists");

    const res = await db.query(QUERY, [user.id, user.username, user.password]);

    return res.rowCount !== 0;
  }

  /**
   * Delete user.
   *
   * @returns An User has been deleted
   * @throws User does not exists
   */
  static async delete(id: crypto.UUID): Promise<boolean> {
    const QUERY = `DELETE FROM users WHERE id=$1`;
    const idExists = await this.findById(id);

    if (!idExists) throw new Error("User does not exist");

    const res = await db.query(QUERY, [id]);

    return res.rowCount !== 0;
  }

  /**
    Update user. This will update all fields.

    @returns User has been updates
  */
  static async update(
    id: crypto.UUID,
    user: Partial<UserEntity>,
  ): Promise<boolean> {
    const columns = Object.keys(user) as Array<keyof UserEntity>;

    const setStatement = columns
      .map((key, index) => `${key}=$${index + 2}`)
      .join(", ");
    const values = [id, ...columns.map((key) => user[key])];

    const QUERY = `UPDATE users SET ${setStatement} WHERE id=$1`;
    const res = await db.query(QUERY, values);

    return res.rowCount !== 0;
  }

  /**
    Find user by UUID

    @returns User, if exists
  */
  static async findById(id: crypto.UUID): Promise<UserEntity | undefined> {
    const res = await db.query("SELECT * FROM users WHERE id=$1", [id]);

    return res.rows ? res.rows[0] : undefined;
  }

  /**
    Find user by username

    @returns User, if exists
  */
  static async findByUsername(
    username: string,
  ): Promise<UserEntity | undefined> {
    const QUERY = `SELECT * FROM users WHERE username=$1`;
    const res = await db.query(QUERY, [username]);

    return res.rows ? res.rows[0] : undefined;
  }

  /**
    Return all users

    @returns List of zero or more users
  */
  static async findAll(): Promise<UserEntity[]> {
    const QUERY = `SELECT * FROM users`;
    const res = await db.query(QUERY);

    return res.rows ? res.rows.map((user) => user as UserEntity) : [];
  }
}

export const usersRouter = Router();
//usersRouter.use(protectRoute);

usersRouter
  .route("/users")
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
  .route("/users/:username")
  .get(async (req, res) => {
    let { username } = req.params;
    let user = await UserRepository.findByUsername(username);

    if (!user) {
      res.status(404).send({ message: "User not found" });
      return;
    }

    res.status(200).send(getPublicUser(user));
  })
  .put(async (req, res) => {
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
  })
  .delete(async (req, res) => {
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
  .route("/users/id/:uuid")
  .get(async (req, res) => {
    let { uuid } = req.params;
    let user = await UserRepository.findById(uuid as crypto.UUID);

    if (!user) {
      res.status(404).send({ message: "User not found" });
      return;
    }

    res.status(200).send(getPublicUser(user));
  })
  .put(async (req, res) => {
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
  })
  .delete(async (req, res) => {
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
