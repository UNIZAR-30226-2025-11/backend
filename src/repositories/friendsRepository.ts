import { db } from "../db.js";
import logger from "../config/logger.js";
import { FriendsJSON, UserAvatarJSON } from "../api/restAPI.js";


export class FriendsRepository {

    /**
     * Retrieves all accepted friends of a given user
     * @param username - The user whose friends to retrieve
     * @returns Array of friend usernames
     * @throws Error if database operation fails
     */
    static async obtainFriends (username: string): Promise<FriendsJSON[]> {
        try {
            logger.silly(`[DB] AWAITT: Obtaining the friends of ${username}` )
            const res = await db.query(
                `
                SELECT u.username, u.avatar
                FROM friends f
                JOIN users u ON (
                    (
                    (f.applier_username = u.username AND f.applied_username = $1)
                    OR
                    (f.applied_username = u.username AND f.applier_username = $1)
                    )
                    AND f.is_accepted = true
                )
                `, [username]);
            if (res.rows.length > 0) {
                logger.silly(`[DB] DONE: Obtained the friends of ${username}` )
                return res.rows.map(row => ({
                    username: row.username,
                    avatar: row.avatar,
                }));
            } else {
                logger.silly(`[DB] DONE: No friends found for ${username}` )
                return [];
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
    static async obtainPendingFriendRequestReceived (username :string):  Promise<UserAvatarJSON[]>{
        try {

            logger.silly(`[DB] AWAITT: Obtaining the pending friend requests received by ${username}` )
            const res = await db.query(
                `
                SELECT u.username, u.avatar
                FROM friends f
                JOIN users u ON (
                    (f.applier_username = u.username AND f.applied_username = $1)
                )
                WHERE f.is_accepted = false
                `, [username]);
            if (res.rows.length > 0) {
                logger.silly(`[DB] DONE: Obtained the pending friend requests received by ${username}` )
                return res.rows.map(row => ({
                    username: row.username,
                    avatar: row.avatar
                }));
            } else {
                return [];
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
    static async obtainPendingFriendRequestSent (username :string):  Promise<UserAvatarJSON[]>{
        try {
            logger.silly(`[DB] AWAITT: Obtaining the pending friend requests sent by ${username}` )
            const res = await db.query(
                `
                SELECT u.username, u.avatar
                FROM friends f
                JOIN users u ON (
                    (f.applier_username = u.username AND f.applied_username = $1)
                )
                WHERE f.is_accepted = false
                `, [username]);
            if (res.rows.length > 0) {
                logger.silly(`[DB] DONE: Obtained the pending friend requests sent by ${username}` )
                return res.rows.map(row => ({
                    username: row.username,
                    avatar: row.avatar
                }));
            } else {
                return [];
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
    static async getPendingFriendRequestsCount(username:string): Promise<number>{
        try {
            const friends = await FriendsRepository.obtainPendingFriendRequestSent(username);
            
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
    static async searchNewFriends (username :string) :  Promise<UserAvatarJSON[]>{
        try {
            logger.silly(`[DB] AWAITT: Searching new friends for ${username}` )
            const res = await db.query(
                `
                SELECT username, avatar
                FROM users
                WHERE username != $1 AND username NOT IN 
                (
                SELECT applied_username as username
                FROM friends
                WHERE applier_username = $1
                )
                `, [username]);
            if (res.rows.length > 0) {
                logger.silly(`[DB] DONE: Found new friends for ${username}` )
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

    static async areFriends (user1:string, user2:string): Promise<boolean> {
        try {
            logger.silly(`[DB] AWAITT: Checking if ${user2} and ${user1} are friends` )
            const res = await db.query(
                `
                SELECT * FROM friends
                WHERE ((applied_username = $1 AND applier_username = $2) OR (applied_username = $2 AND applier_username = $1))
                AND is_accepted = true
                `, [user2, user1]);
            if (res.rows.length > 0) {
                logger.silly(`[DB] DONE: ${user2} and ${user1} are friends` )
                return true;
            } else {
                logger.silly(`[DB] DONE: ${user2} and ${user1} are not friends` )
                return false;
            }
        }

        catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

    static async haveAlreadySentRequest (applierUsername:string, appliedUsername:string): Promise<boolean> {
        try {
            logger.silly(`[DB] AWAITT: Checking if ${appliedUsername} has sent a request to ${applierUsername}` )
            const res = await db.query(
                `
                SELECT * FROM friends
                WHERE (applied_username = $1 AND applier_username = $2)
                AND is_accepted = false
                `, [appliedUsername, applierUsername]);
            if (res.rows.length > 0) {
                logger.silly(`[DB] DONE: ${appliedUsername} has sent a request to ${applierUsername}` )
                return true;
            } else {
                logger.silly(`[DB] DONE: ${appliedUsername} has not sent a request to ${applierUsername}` )
                return false;
            }
        }
        catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

    /**
     * Creates a new friend request relationship.
     * @param applierUsername - The sender of the friend request
     * @param appliedUsername - The recipient of the friend request
     */
    static async createNewFriendsRequest(applierUsername:string, appliedUsername:string){
        try {
            logger.silly(`[DB] AWAITT: Adding new friend ${appliedUsername} to ${applierUsername}` )
            const res = await db.query(
                `
                INSERT INTO friends (applied_username, applier_username, is_accepted)
                VALUES ($1, $2, false)
                RETURNING *
                `,[appliedUsername, applierUsername]);
            
            if (res.rowCount === 0) {
                logger.warn(`[DB] WARN: No friend request inserted from ${applierUsername} to ${appliedUsername}`)
            } else {
                logger.silly(`[DB] DONE: Added new friend ${appliedUsername} to ${applierUsername}` )
            }
        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

     /**
     * Creates a new accepted friend relationship (NOTE: Contains syntax error)
     * @param appliedUsername - The recipient of the friend request
     * @param applierUsername - The sender of the friend request
     * @throws Error if database operation fails
     */
    static async acceptNewFriend(applierUsername:string, appliedUsername:string){
        try {
            logger.silly(`[DB] AWAITT: Accepting new friend ${appliedUsername} to ${applierUsername}` )
            const res = await db.query(
                `
                UPDATE friends
                SET is_accepted = true
                WHERE applied_username = $1 AND applier_username = $2
                RETURNING *
                `, [appliedUsername, applierUsername]);
            
            if (res.rowCount === 0) {
                logger.warn(`[DB] WARN: No matching friend request found from ${applierUsername} to ${appliedUsername}`)
            }
            else {
                logger.silly(`[DB] DONE: Accepted new friend ${appliedUsername} to ${applierUsername}` )
            }
        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

    /**
     * Declines a friend request relationship.
     * @param appliedUsername - One user in the relationship
     * @param applierUsername - The other user in the relationship
     * @throws Error if database operation fails
     */
    static async declineRelationshipRequest(applierUsername: string, appliedUsername: string) {
        try {
            logger.silly(`[DB] AWAITT: Deleting friend request from ${applierUsername} to ${appliedUsername}`)
            const res = await db.query(
                `
                DELETE FROM friends 
                WHERE applied_username = $1 AND applier_username = $2 AND is_accepted = false
                RETURNING *
                `, [appliedUsername, applierUsername]);
            
            if (res.rowCount === 0) {
                logger.warn(`[DB] WARN: No matching friend request found from ${applierUsername} to ${appliedUsername}`)
            } else {
                logger.silly(`[DB] DONE: Deleted friend request from ${applierUsername} to ${appliedUsername}`)
            }
        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

    static async deleteFriendship(user1:string, user2:string){
        try {
            logger.silly(`[DB] AWAITT: Deleting friendship between ${user1} and ${user2}` )
            const res = await db.query(
                `
                DELETE FROM friends 
                WHERE (applied_username = $1 AND applier_username = $2) OR (applied_username = $2 AND applier_username = $1)
                RETURNING *
                `,[user1, user2]);
            
            if(res.rowCount === 0) {
                logger.warn(`[DB] WARN: No matching friendship found between ${user1} and ${user2}`)
            }
            else {
                logger.silly(`[DB] DONE: Deleted friendship between ${user1} and ${user2}` )
            }
        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

}