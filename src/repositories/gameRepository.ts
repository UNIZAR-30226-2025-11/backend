import { db } from "../db.js";

export class GameRepository {

    static async getPlayerIdInGame(username: string): Promise<number | undefined> {
        try {
            const res = await db.query(
                `
                SELECT id_in_game 
                FROM users_in_lobby 
                WHERE username = $1
                `, [username]);

            if (res.rows.length > 0) {
                return res.rows[0].id_in_game

            } else {
                return undefined;
            }
        } catch (error) {
            console.error("Error in database.", error);
            throw new Error("Error in database");
        }
    }

    static async addCoinsToPlayer(username: string, coins: number): Promise<void> {
        try {
            await db.query(
                `
                UPDATE users
                SET coins = coins + $1
                WHERE username = $2
                `, [coins, username]);

        } catch (error) {
            console.error("Error in database.", error);
            throw new Error("Error in database");
        }
    }

    static async addWinToPlayer(username: string): Promise<void> {
        try {
            await db.query(
                `
                UPDATE users
                SET games_won = games_won + 1
                WHERE username = $1
                `, [username]);

        } catch (error) {
            console.error("Error in database.", error);
            throw new Error("Error in database");
        }
    }

    static async addGamePlayedToLobby(lobbyId: string): Promise<void> {
        try {
            await db.query(
                `
                UPDATE users
                SET games_played = games_played + 1
                FROM users_in_lobby
                WHERE users.username = users_in_lobby.username
                AND users_in_lobby.lobby_id = $1
                `, [lobbyId]);

        }
        catch (error) {
            console.error("Error in database.", error);
            throw new Error("Error in database");
        }
    }

}