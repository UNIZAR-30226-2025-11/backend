import { db } from "../db.js";
import crypto from "node:crypto";
import logger from "../config/logger.js";
import { FriendsJSON } from "../api/restAPI.js";


export class friendsRepository {

    /**
     * Retrieves all accepted friends of a given user
     * @param username - The user whose friends to retrieve
     * @returns Array of friend usernames
     * @throws Error if database operation fails
     */
    static async obtainFriends (username: string): Promise<FriendsJSON[]> {
        try {
            const res = await db.query(
                `
                SELECT u.username, u.avatar
                FROM friends f
                JOIN users u ON (
                    (f.applier_username = u.username AND f.applied_username = $1)
                    OR
                    (f.applied_username = u.username AND f.applier_username = $1)
                )
                WHERE f.isAccepted = true
                `, [username]);
            if (res.rows.length > 0) {
                return res.rows.map(row => ({
                    username: row.username,
                    avatar: row.avatar
                }));
            } else {
                logger.error("[DB] Error in database.");
                throw new Error("Error in database");
            }
        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

    /**
     * Retrieves pending friend requests received by a user
     * @param username - The user who received requests
     * @returns Array of usernames who sent pending requests
     * @throws Error if database operation fails
     */
    static async obtainAppliedFriends (username :string):  Promise<FriendsJSON[]>{
        try {
            const res = await db.query(
                `
                SELECT u.username, u.avatar
                FROM friends f
                JOIN users u ON (
                    (f.applier_username = u.username AND f.applied_username = $1)
                )
                WHERE f.isAccepted = false
                `, [username]);
            if (res.rows.length > 0) {
                return res.rows.map(row => ({
                    username: row.username,
                    avatar: row.avatar
                }));
            } else {
                logger.error("[DB] Error in database.");
                throw new Error("Error in database");
            }
        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

     /**
     * Retrieves pending friend requests sent by a user
     * @param username - The user who sent requests
     * @returns Array of usernames who received pending requests
     * @throws Error if database operation fails
     */
    static async obtainApplierFriends (username :string):  Promise<FriendsJSON[]>{
        try {
            const res = await db.query(
                `
                SELECT u.username, u.avatar
                FROM friends f
                JOIN users u ON (
                    (f.applied_username = u.username AND f.applier_username = $1)
                )
                WHERE f.isAccepted = false
                `, [username]);
            if (res.rows.length > 0) {
                return res.rows.map(row => ({
                    username: row.username,
                    avatar: row.avatar
                }));
            } else {
                logger.error("[DB] Error in database.");
                throw new Error("Error in database");
            }
        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

    /**
     * Counts the number of pending friend requests sent by a user
     * @param username - The username to check for pending requests
     * @returns Number of pending friend requests sent by the user
     * @throws Error if database operation fails
     */
    static async numRequest(username:string): Promise<number>{
        try {
            const friends = await friendsRepository.obtainApplierFriends(username);
            
            return friends.length;
            
        } catch (error) {
            logger.error("[DB] Error in database:", error);
            throw new Error("Error in database");
        }
    }

     /**
     * Finds potential new friends (users with no existing relationship)
     * @param username - The user searching for new friends
     * @returns Array of available usernames
     * @throws Error if database operation fails
     */
    static async searchNewFriends (username :string) :  Promise<FriendsJSON[]>{
        try {
            const res = await db.query(
                `
                SELECT username, avatar
                FROM users
                WHERE username != $1 AND username NOT IN 
                (
                SELECT applier_username as username
                FROM friends
                WHERE applied_username = $1

                UNION

                SELECT applied_username as username
                FROM friends
                WHERE applier_username = $1
                )
                `, [username]);
            if (res.rows.length > 0) {
                return res.rows.map(row => ({
                    username: row.username,
                    avatar: row.avatar
                }));
            } else {
                logger.error("[DB] Error in database.");
                throw new Error("Error in database");
            }
        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

    /**
     * Updates a friend request to accepted status
     * @param applied_username - The recipient of the friend request
     * @param applier_username - The sender of the friend request
     * @throws Error if database operation fails
     */
    static async addNewFriend(applied_username:string, applier_username:string){
        try {
            const res = await db.query(
                `
                UPDATE friends 
                SET isAccepted = true
                WHERE applied_username = $1 AND applier_username = $2
                `,[applied_username, applier_username]);

        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

     /**
     * Creates a new accepted friend relationship (NOTE: Contains syntax error)
     * @param applied_username - The recipient of the friend request
     * @param applier_username - The sender of the friend request
     * @throws Error if database operation fails
     */
    static async acceptNewFriend(applied_username:string, applier_username:string){
        try {
            const res = await db.query(
                `
                UPDATE INTO friends (applied_username, applier_username, isAccepted)
                VALUES ($1, $2, true)
                `,[applied_username, applier_username]);

        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

    /**
     * Deletes a friend relationship
     * @param applied_username - One user in the relationship
     * @param applier_username - The other user in the relationship
     * @throws Error if database operation fails
     */
    static async deleteNewFriend(applied_username:string, applier_username:string){
        try {
            const res = await db.query(
                `
                DELETE FROM friends 
                WHERE applied_username = $1 AND applier_username = $2
                `,[applied_username, applier_username]);

        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }
}