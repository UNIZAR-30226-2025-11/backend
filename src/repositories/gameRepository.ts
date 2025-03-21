import logger from "../config/logger.js";
import { db } from "../db.js";

export class GameRepository {

    static async getPlayerIdInGame(username: string): Promise<number|undefined> {
        try {

            logger.debug(`[DB] AWAIT: Getting player id in game for ${username}`);
            const res = await db.query(
                `
                SELECT id_in_game 
                FROM users_in_lobby 
                WHERE username = $1
                `, [username]);
            
            if (res.rows.length > 0) {
                logger.debug(`[DB] DONE: Got player id ${res.rows[0].id_in_game} in game for ${username}`);
                return res.rows[0].id_in_game
            } else {
                logger.warn(`[DB] DONE: Could not fetch the player ${username} id in game.`);
                return undefined;
            }
        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

    static async addCoinsToPlayer(username: string, coins: number): Promise<void> {
        try {
            logger.debug(`[DB] AWAIT: Adding ${coins} coins to ${username}`);
            await db.query(
                `
                UPDATE users, coins
                SET coins = coins + $1
                WHERE username = $2
                RETURNING *
                `, [coins, username]);
            logger.debug(`[DB] DONE: Added ${coins} coins to ${username}`);

        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

    static async addWinToPlayer(username: string): Promise<void> {
        try {
            logger.debug(`[DB] AWAIT: Adding win to ${username}`);
            await db.query(
                `
                UPDATE users
                SET games_won = games_won + 1
                WHERE username = $1
                `, [username]);
            logger.debug(`[DB] DONE: Added win to ${username}`);

        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

    static async addGamePlayedToLobby(lobbyId: string): Promise<void> {
        try {
            logger.debug(`[DB] AWAIT: Adding game played to lobby ${lobbyId}`);
            await db.query(
                `
                UPDATE users
                SET games_played = games_played + 1
                FROM users_in_lobby
                WHERE users.username = users_in_lobby.username
                AND users_in_lobby.lobby_id = $1
                `, [lobbyId]);
            logger.debug(`[DB] DONE: Added game played to lobby ${lobbyId}`);

        }
        catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

}