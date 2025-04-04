import { db } from "../db.js";
import crypto from "node:crypto";
import { UserEntity } from "../models/User.js";
import logger from "../config/logger.js";
import bcrypt from "bcrypt";


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

        const idExists = await this.findById(user.id);
        const userExists = await this.findByUsername(user.username);
    
        if (idExists || userExists){
            logger.warn(`[DB] Could not create user ${user.username} because it already exists`);
            throw new Error("User exists");
        }

        try {
            logger.silly(`[DB] AWAIT: Creating user ${user.username}`);
            const res = await db.query(
                `
                INSERT INTO users(id, username, password)
                VALUES ($1, $2, $3)
                `, [user.id, user.username, user.password]
            );
            if (res.rowCount !== 0) {
                logger.silly(`[DB] DONE: Created user ${user.username}`);
                return true;
            } else {
                logger.warn(`[DB] DONE: Could not create user ${user.username}`);
                return false;
            }
        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }

    }
  
    /**
     * Delete user.
     *
     * @returns An User has been deleted
     * @throws User does not exists
     */
    static async delete(id: crypto.UUID): Promise<boolean> {

        const idExists = await this.findById(id);
        if (!idExists)
        {
            logger.warn(`[DB] Could not delete user ${id} because it does not exist`);
            throw new Error("User exists");
        }
        
        try {
            logger.silly(`[DB] AWAIT: Deleting user ${id}`);
            const res = await db.query(
                `
                DELETE FROM users
                WHERE id = $1
                `, [id]);
            if (res.rowCount !== 0) {
                logger.silly(`[DB] DONE: Deleted user ${id}`);
                return true;
            } else {
                logger.warn(`[DB] DONE: Could not delete user ${id}`);
                return false;
            }
        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }

    }
  
    /**
     * Update user.
     * @param id The id of the user to update
     * @param user The new user data
     * @returns True if the user was updated, false otherwise
     */
    static async update(
        id: crypto.UUID,
        user: Partial<UserEntity>,
    ): Promise<boolean> {

        if(user.password !== undefined){
            user.password = await bcrypt.hash(user.password, 10);
        }
        
        const columns = Object.keys(user) as Array<keyof UserEntity>;
        const setStatement = columns
            .map((key, index) => `${key}=$${index + 2}`)
            .join(", ");
        const values = [id, ...columns.map((key) => user[key])];
    
        try{
            logger.silly(`[DB] AWAIT: Updating user ${id}`);
            const res = await db.query(
                `
                UPDATE users
                SET ${setStatement}
                WHERE id = $1
                `, values);
            if (res.rowCount !== 0) {
                logger.silly(`[DB] DONE: Updated user ${id}`);
                return true;
            } else {
                logger.warn(`[DB] DONE: Could not update user ${id}`);
                return false;
            }
        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }
  
    /**
     * Find user by uuid.
     * @param id The id of the user to search for
     * @returns The user if exists, undefined otherwise
     */
    static async findById(id: crypto.UUID): Promise<UserEntity | undefined> {

        try {
            const res = await db.query(
                `
                SELECT * 
                FROM users 
                WHERE id=$1
                `, [id]);
            if (res.rows.length > 0) {
                return res.rows[0] as UserEntity;
            } else {
                return undefined;
            }
        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }

    }
  
   /**
    * Find user by username
    * @param username The username to search for
    * @returns User if exists, undefined otherwise
    */
    static async findByUsername(
        username: string,
    ): Promise<UserEntity | undefined> {

        try {
            const res = await db.query(
                `
                SELECT * 
                FROM users 
                WHERE username=$1
                `, [username]);
            if (res.rows.length > 0) {
                return res.rows[0] as UserEntity;
            } else {
                return undefined;
            }
        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }
    
    /**
     * Find all users
     * @returns All users
     */
    static async findAll(): Promise<UserEntity[]> {

        try {
            logger.silly(`[DB] AWAIT: Getting all users`);
            const res = await db.query(
                `
                SELECT * 
                FROM users
                `);
            if (res.rows.length > 0) {
                logger.silly(`[DB] DONE: Got all users`);
                return res.rows as UserEntity[];
            } else {
                return [];
            }
        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }
  }
  