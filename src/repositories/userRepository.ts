import { db } from "../db.js";
import crypto from "node:crypto";
import { UserEntity } from "../models/User.js";

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
  