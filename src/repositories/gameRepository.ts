import { db } from "../db.js";

export class GameRepository {

    static async getPlayerIdInGame(socket_id: string): Promise<number | undefined> {
        try {
            const res = await db.query(
                `
                SELECT player_id 
                FROM lobbies_sockets 
                WHERE socket_id = $1
                `, [socket_id]);

            if (res.rows.length > 0) {
                return res.rows[0].player_id

            } else {
                return undefined;
            }
        } catch (error) {
            console.error("Error in database.", error);
            throw new Error("Error in database");
        }
    }
}