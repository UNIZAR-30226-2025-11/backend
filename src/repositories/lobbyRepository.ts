import { db } from "../db.js";
import { GameObject } from "../models/GameObject.js";

export class LobbyRepository {
    
    static async createLobby(lobbyId: string, leaderusername: string, numMaxPlayers: number): Promise<void> {
        await db.query(
            "INSERT INTO lobbies (id, game, leader, num_max_players) VALUES ($1, $2, $3, $4)",
            [lobbyId, null, leaderusername, numMaxPlayers]
        );
    }

    static async removeLobby(lobbyId: string): Promise<void> {
        console.log("Removing lobby " + lobbyId);
        try {
            await db.query(
                `
                DELETE FROM lobbies 
                WHERE id = $1
                `, [lobbyId]
            );

            console.log("Lobby removed");

        } catch (error) {
            console.error("Error in database.", error);
            throw new Error("Error in database");
        }
    }
    

    static async startLobby(lobbyId: string, game:GameObject): Promise<void> {
        try {
            await db.query(
                `
                UPDATE lobbies
                SET active = TRUE, game=$2
                WHERE id = $1
                `, [lobbyId, game.toJSON()]
            );
        }
        catch (error) {
            console.error("Error in database.", error);
            throw new Error("Error in database");
        }
    }

    static async isActive(lobbyId: string): Promise<boolean> {
        try {
            const res = await db.query(
                `
                SELECT active 
                FROM lobbies 
                WHERE id = $1
                `
                , [lobbyId]);
    
            if (res.rows.length > 0) {
                return res.rows[0].active;
            } else {
                console.log("Lobby not found.")
                return false;
            }
            
        } catch (error) {
            console.error("Error in database.", error);
            throw new Error("Error in database");
        }
    }
    
    static async isLeader(username: string, lobbyId: string): Promise<boolean>{
        try {
            const res = await db.query(
                `
                SELECT leader 
                FROM lobbies
                WHERE id = $1
                `
                , [lobbyId]);

            if (res.rows.length > 0 && res.rows[0].leader === username){
                return true;
            }else{
                return false;
            }
    
        } catch (error) {
            console.error("Error in database.", error);
            throw new Error("Error in database");
        }
    }

    static async getMaxPlayers(lobbyId: string): Promise<number | undefined>{
        try {
            const res = await db.query(
                `SELECT num_max_players
                FROM lobbies
                WHERE id = $1`
                , [lobbyId]);
            
                if (res.rows.length > 0 ){
                    return res.rows[0].num_max_players;
                }else{
                    return undefined;
                }
    
        } catch (error) {
            console.error("Error removing a player:", error);
        }
    }

    static async getCurrentPlayers(lobbyId: string): Promise<number | undefined>{
        try{
            const res = await db.query(
                `SELECT COUNT(*) as num
                FROM users_in_lobby
                WHERE lobby_id = $1`
                , [lobbyId]);
            
            if (res.rows.length > 0 ){
                return res.rows[0].num;
            }else{
                return undefined;
            }

        } catch (error) {
            console.error("Error removing a player:", error);
        }
    }

    static async getPlayersInLobby(lobbyId: string): Promise<{ username: string, isLeader: boolean}[] | undefined>{
        try {
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
    
            return res.rows.map((row: { username: string, is_leader: boolean}) => ({ username: row.username, isLeader: row.is_leader}));
        }
        catch (error) {
            console.error("Error in database.", error);
            return undefined;
        }
    }

    static async getLobbyWithPlayer(username: string): Promise<string | undefined>{
        try {
            const res = await db.query(
                `
                SELECT lobby_id 
                FROM users_in_lobby 
                WHERE username = $1
                `, [username]);
    
            if(res.rows.length > 0){
                return res.rows[0].lobby_id;
            }else{
                return undefined;
            }
        } catch (error) {
            console.error("Error in database.", error);
            return undefined;
        }
    }
    
    static async removePlayerFromLobby(username: string, lobbyId: string): Promise<void | undefined>{
        try {
            await db.query(
                `
                DELETE FROM users_in_lobby 
                WHERE username = $1 AND lobby_id = $2
                RETURNING lobby_id;
                `
                , [username, lobbyId]
            );

            return;
    
        } catch (error) {
            console.error("Error removing a player:", error);
            return undefined
        }
    }

    static async addPlayer(username: string, lobbyId: string): Promise<void> {
        try {
            const res = await db.query(
                `
                INSERT INTO users_in_lobby (lobby_id, username, id_in_game)
                VALUES ($1, $2, $3)
                `,
                [lobbyId, username, null]
            );
            
            if (res.rowCount && res.rowCount > 0) {
                console.log("Player added");
            } else {
                console.log("Cannot add player.");
            }
    
        } catch (error) {
            console.error("Error in database.", error);
        }
    }

    static async setPlayerIdInGame(username: string, playerId: number): Promise<void> {
        try {
            const res = await db.query(
                `
                UPDATE users_in_lobby 
                SET id_in_game = $2
                WHERE username = $1
                `,
                [username, playerId]
            );

            if(res.rowCount && res.rowCount > 0){
                console.log("Player set in game");
            }
            else{
                console.log("Cannot set player in game.");
            }
        } catch (error) {
            console.error("Error in database.", error);
            throw new Error("Error in database");
        }
    }

}