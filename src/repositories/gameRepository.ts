import logger from "../config/logger.js";
import { db } from "../db.js";

export class GameRepository {

    static async addCoinsToPlayer(username: string, coins: number): Promise<void> {
        try {
            logger.silly(`[DB] AWAIT: Adding ${coins} coins to ${username}`);
            await db.query(
                `
                UPDATE users
                SET coins = coins + $1
                WHERE username = $2
                `, [coins, username]);
            logger.silly(`[DB] DONE: Added ${coins} coins to ${username}`);

        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

    static async addWinToPlayer(username: string): Promise<void> {
        try {
            logger.silly(`[DB] AWAIT: Adding win to ${username}`);
            await db.query(
                `
                UPDATE users
                SET games_won = games_won + 1
                WHERE username = $1
                `, [username]);
            logger.silly(`[DB] DONE: Added win to ${username}`);

        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

    static async addGamePlayedToLobby(lobbyId: string): Promise<void> {
        try {
            logger.silly(`[DB] AWAIT: Adding game played to lobby ${lobbyId}`);
            await db.query(
                `
                UPDATE users
                SET games_played = games_played + 1
                FROM users_in_lobby
                WHERE users.username = users_in_lobby.username
                AND users_in_lobby.lobby_id = $1
                `, [lobbyId]);
            logger.silly(`[DB] DONE: Added game played to lobby ${lobbyId}`);

        }
        catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

    static async addStreakWinToPlayer(username: string): Promise<number> {
        try {
            logger.silly(`[DB] AWAIT: Adding streak win to ${username}`);
            const res = await db.query(
                `
                UPDATE users
                SET current_streak = current_streak + 1
                WHERE username = $1
                RETURNING current_streak
                `, [username]);
            logger.silly(`[DB] DONE: Added streak win to ${username}`);
            
            if (res.rows.length > 0) {
                return res.rows[0].current_streak;
            } else {
                logger.warn(`[DB] No rows found for ${username}`);
                return 0;
            }

        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

    static async getMaxStreakWin(username: string): Promise<number> {
        try {
            logger.silly(`[DB] AWAIT: Getting max streak win for ${username}`);
            const res = await db.query(
                `
                SELECT max_streak
                FROM users
                WHERE username = $1
                `, [username]);
            logger.silly(`[DB] DONE: Got max streak win for ${username}`);

            if (res.rows.length > 0) {
                return res.rows[0].max_streak_win;
            } else {
                logger.warn(`[DB] No rows found for ${username}`);
                return 0;
            }
        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

    static async setMaxStreakWin(username: string, maxStreak: number): Promise<void> {
        try {
            logger.silly(`[DB] AWAIT: Setting max streak win for ${username}`);
            await db.query(
                `
                UPDATE users
                SET max_streak = $1
                WHERE username = $2
                `, [maxStreak, username]);
            logger.silly(`[DB] DONE: Set max streak win for ${username}`);

        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

    static async removeStreakWinToPlayer(username: string): Promise<void> {
        try {
            logger.silly(`[DB] AWAIT: Removing streak win to ${username}`);
            await db.query(
                `
                UPDATE users
                SET current_streak = 0
                WHERE username = $1
                `, [username]);
            logger.silly(`[DB] DONE: Removed streak win to ${username}`);

        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

    static async addHistoryToPlayer(player: string, lobbyId: string, isWinner: boolean, gameDate: Date): Promise<void> {
        try {
            logger.silly(`[DB] AWAIT: Adding history to ${player}`);
            await db.query(
                `
                INSERT INTO game_history (player, lobby_id, win, game_date)
                VALUES ($1, $2, $3, $4)
                `, [player, lobbyId, isWinner, gameDate]);
            logger.silly(`[DB] DONE: Added history to ${player}`);

        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

    static async addTimePlayedToPlayer(username: string, timePlayed: number): Promise<void> {
        try {
            logger.silly(`[DB] AWAIT: Adding time played to ${username}`);
            await db.query(
                `
                UPDATE users
                SET total_time_played = total_time_played + $1
                WHERE username = $2
                `, [timePlayed, username]);
            logger.silly(`[DB] DONE: Added time played to ${username}`);

        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

    static async addTurnsPlayedToPlayer(username: string, turnsPlayed: number): Promise<void> {
        try {
            logger.silly(`[DB] AWAIT: Adding turns played to ${username}`);
            await db.query(
                `
                UPDATE users
                SET total_turns_played = total_turns_played + $1
                WHERE username = $2
                `, [turnsPlayed, username]);
            logger.silly(`[DB] DONE: Added turns played to ${username}`);

        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

}