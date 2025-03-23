import logger from "../config/logger.js";
import { db } from "../db.js";

export class LobbyRepository {
    
    static async lobbyExists(lobbyId: string): Promise<boolean> {
        try {
            logger.silly(`[DB] AWAIT: Checking if lobby ${lobbyId} exists`);
            const res = await db.query(
                `
                SELECT id 
                FROM lobbies 
                WHERE id = $1
                `, [lobbyId]
            );
            logger.silly(`[DB] DONE: Got existance "${res.rows.length > 0}" for lobby ${lobbyId}`);
            return res.rows.length > 0;
        }
        catch (error) {
            logger.error("[DB] Error in database:", error);
            throw new Error("Error in database");
        }
    }

    static async createLobby(lobbyId: string, leaderusername: string, numMaxPlayers: number): Promise<void> {
        try{
            logger.silly(`[DB] AWAIT: Creating lobby ${lobbyId} with leader ${leaderusername} and max players ${numMaxPlayers}`);
            await db.query(
                `
                INSERT INTO lobbies (id, game, leader, num_max_players) 
                VALUES ($1, $2, $3, $4)
                `, [lobbyId, null, leaderusername, numMaxPlayers]
            );
            logger.silly(`[DB] DONE: Created lobby ${lobbyId} with leader ${leaderusername} and max players ${numMaxPlayers}`);
        } catch (error) {
            logger.error("[DB] Error in database:", error);
            throw new Error("Error in database");
        }
    }

    static async removeLobby(lobbyId: string): Promise<void> {
        try {
            logger.silly(`[DB] AWAIT: Removing lobby ${lobbyId}`);
            await db.query(
                `
                DELETE FROM lobbies 
                WHERE id = $1
                `, [lobbyId]
            );
            logger.silly(`[DB] DONE: Removed lobby ${lobbyId}`);
        } catch (error) {
            logger.error("[DB] Error in database:", error);
            throw new Error("Error in database");
        }
    }
    

    static async startLobby(lobbyId: string): Promise<void> {
        try {
            logger.silly(`[DB] AWAIT: Starting lobby ${lobbyId}`);
            await db.query(
                `
                UPDATE lobbies
                SET active = TRUE, game=$2
                WHERE id = $1
                `, [lobbyId, null]
            );
            logger.silly(`[DB] DONE: Started lobby ${lobbyId}`);
        }
        catch (error) {
            logger.error("[DB] Error in database:", error);
            throw new Error("Error in database");
        }
    }

    static async isActive(lobbyId: string): Promise<boolean|undefined> {
        try {

            logger.silly(`[DB] AWAIT: Getting active status for lobby ${lobbyId}`);
            const res = await db.query(
                `
                SELECT active 
                FROM lobbies 
                WHERE id = $1
                `
                , [lobbyId]);
            
            if (res.rows.length > 0) {
                logger.silly(`[DB] DONE: Got active status "${res.rows[0].active}" for lobby ${lobbyId}`);
                return res.rows[0].active;
            } else {
                logger.warn(`[DB] DONE: Could not fetch the active status for lobby ${lobbyId}`);
                return undefined;
            }
            
        } catch (error) {
            logger.error("[DB] Error in database:", error);
            throw new Error("Error in database");
        }
    }
    
    static async isLeader(username: string, lobbyId: string): Promise<boolean|undefined>{
        try {
            logger.silly(`[DB] AWAIT: Getting leader for lobby ${lobbyId}`);
            const res = await db.query(
                `
                SELECT leader 
                FROM lobbies
                WHERE id = $1
                `
                , [lobbyId]);

            if (res.rows.length > 0 ){
                logger.silly(`[DB] DONE: Got leader status "${res.rows[0].leader}" for lobby ${lobbyId}`);
                return res.rows[0].leader === username;
            }else{
                logger.warn(`[DB] DONE: Could not fetch the leader status for lobby ${lobbyId}`);
                return undefined;
            }
    
        } catch (error) {
            logger.error("[DB] Error in database:", error);
            throw new Error("Error in database");
        }
    }

    static async getMaxPlayers(lobbyId: string): Promise<number|undefined>{
        try {
            logger.silly(`[DB] AWAIT: Getting max players for lobby ${lobbyId}`);
            const res = await db.query(
                `SELECT num_max_players
                FROM lobbies
                WHERE id = $1`
                , [lobbyId]);
            
                if (res.rows.length > 0 ){
                    logger.silly(`[DB] DONE: Got max players "${res.rows[0].num_max_players}" for lobby ${lobbyId}`);
                    return res.rows[0].num_max_players;
                }else{
                    logger.warn(`[DB] DONE: Could not fetch the max players for lobby ${lobbyId}`);
                    return undefined;
                }
    
        } catch (error) {
            logger.error("[DB] Error in database:", error);
            throw new Error("Error in database");
        }
    }

    static async getCurrentNumberOfPlayersInLobby(lobbyId: string): Promise<number|undefined>{
        try{
            logger.silly(`[DB] AWAIT: Getting current number of players for lobby ${lobbyId}`);
            const res = await db.query(
                `SELECT COUNT(*) as num
                FROM users_in_lobby
                WHERE lobby_id = $1`
                , [lobbyId]);
            
            if (res.rows.length > 0 ){
                logger.silly(`[DB] DONE: Got current number of players "${res.rows[0].num}" for lobby ${lobbyId}`);
                return res.rows[0].num;
            }else{
                logger.warn(`[DB] DONE: Could not fetch the current number of players for lobby ${lobbyId}`);
                return undefined;
            }

        } catch (error) {
            logger.error("[DB] Error in database:", error);
            throw new Error("Error in database");
        }
    }

    static async getPlayersInLobby(lobbyId: string): Promise<string[]>{
        try {
            logger.silly(`[DB] AWAIT: Getting players in lobby ${lobbyId}`);
            const res = await db.query(
                `
                SELECT username 
                FROM users_in_lobby 
                WHERE lobby_id = $1
                `, [lobbyId]);
            
            const result = res.rows.map((row: { username: string }) => row.username);
            logger.silly(`[DB] DONE: Got players in lobby ${lobbyId}: %j`, result);
            return result;
        } catch (error) {
            logger.error("[DB] Error in database:", error);
            throw new Error("Error in database");
        }
    
    }

    static async getPlayersInLobbyBeforeStart(lobbyId: string): Promise<{ username: string, isLeader: boolean}[]>{
        try {
            logger.silly(`[DB] AWAIT: Getting players in lobby ${lobbyId}`);
            const res = await db.query(
                `
                SELECT 
                    users_in_lobby.username AS username, 
                    (lobbies.leader = users_in_lobby.username) AS is_leader
                FROM users_in_lobby
                INNER JOIN lobbies ON users_in_lobby.lobby_id = lobbies.id
                WHERE users_in_lobby.lobby_id = $1
                AND users_in_lobby.id_in_game IS NULL;
                `, [lobbyId]);
                
            const result = res.rows.map((row: { username: string, is_leader: boolean}) => ({ username: row.username, isLeader: row.is_leader}));
            logger.silly(`[DB] DONE: Got players in lobby ${lobbyId}: %j`, result);
            return result;
        }
        catch (error) {
            logger.error("[DB] Error in database:", error);
            throw new Error("Error in database");
        }
    }

    static async getLobbyWithPlayer(username: string): Promise<string | undefined>{
        try {
            logger.silly(`[DB] AWAIT: Getting lobby with player ${username}`);
            const res = await db.query(
                `
                SELECT lobby_id 
                FROM users_in_lobby 
                WHERE username = $1
                `, [username]);
    
            if(res.rows.length > 0){
                logger.silly(`[DB] DONE: Got lobby ${res.rows[0].lobby_id} with player ${username}`);
                return res.rows[0].lobby_id;
            }else{
                logger.silly(`[DB] DONE: Could not find lobby with player ${username}`);
                return undefined;
            }
        } catch (error) {
            logger.error("[DB] Error in database:", error);
            throw new Error("Error in database");
        }
    }
    
    static async removePlayerFromLobby(username: string, lobbyId: string): Promise<void>{
        try {
            logger.silly(`[DB] AWAIT: Removing player ${username} from lobby ${lobbyId}`);
            const res = await db.query(
                `
                DELETE FROM users_in_lobby 
                WHERE username = $1 AND lobby_id = $2
                RETURNING lobby_id;
                `
                , [username, lobbyId]
            );

            if(res.rowCount && res.rowCount > 0){
                logger.silly(`[DB] DONE: Removed player ${username} from lobby ${lobbyId}`);
                return;
            }
            else{
                logger.warn(`[DB] DONE: Could not remove player ${username} from lobby ${lobbyId}`);
                return;
            }
    
        } catch (error) {
            logger.error("[DB] Error in database:", error);
            throw new Error("Error in database");
        }
    }

    static async addPlayer(username: string, lobbyId: string): Promise<void> {
        try {
            logger.silly(`[DB] AWAIT: Adding player ${username} to lobby ${lobbyId}`);
            const res = await db.query(
                `
                INSERT INTO users_in_lobby (lobby_id, username, id_in_game)
                VALUES ($1, $2, $3)
                `,
                [lobbyId, username, null]
            );
            
            if (res.rowCount && res.rowCount > 0) {
                logger.silly(`[DB] DONE: Added player ${username} to lobby ${lobbyId}`);
            } else {
                logger.warn(`[DB] DONE: Could not add player ${username} to lobby ${lobbyId}`);
            }
    
        } catch (error) {
            logger.error("[DB] Error in database:", error);
            throw new Error("Error in database");
        }
    }

    static async setPlayerIdInGame(username: string, playerId: number): Promise<void> {
        try {
            logger.silly(`[DB] AWAIT: Setting player ${username} in game`);
            const res = await db.query(
                `
                UPDATE users_in_lobby 
                SET id_in_game = $2
                WHERE username = $1
                `,
                [username, playerId]
            );

            if(res.rowCount && res.rowCount > 0){
                logger.silly(`[DB] DONE: Set player ${username} in game`);
            }
            else{
                logger.warn(`[DB] DONE: Could not set player ${username} in game`);
            }
        } catch (error) {
            logger.error("[DB] Error in database:", error);
            throw new Error("Error in database");
        }
    }

}