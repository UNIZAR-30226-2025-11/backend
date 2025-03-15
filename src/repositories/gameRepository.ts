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
}