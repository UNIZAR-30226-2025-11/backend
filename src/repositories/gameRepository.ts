import logger from "../config/logger.js";
import { db } from "../db.js";

export class GameRepository {

    static async addCoinsToPlayer(username: string, coins: number): Promise<void> {
        try {
            logger.debug(`[DB] AWAIT: Adding ${coins} coins to ${username}`);
            await db.query(
                `
                UPDATE users
                SET coins = coins + $1
                WHERE username = $2
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