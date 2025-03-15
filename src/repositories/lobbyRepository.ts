import { db } from "../db.js";
import { GameObject } from "../models/GameObject.js";

export class LobbyRepository {
    
    static async createLobby(lobbyId: string, leaderSocketId: string, numMaxPlayers: number): Promise<void> {
        await db.query(
            "INSERT INTO lobbies (id, game, leader_socket, num_max_players) VALUES ($1, $2, $3, $4)",
            [lobbyId, null, leaderSocketId, numMaxPlayers]
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
    
    static async isLeader(socketId: string, lobbyId: string): Promise<boolean>{
        try {
            const res = await db.query(
                `
                SELECT leader_socket 
                FROM lobbies
                WHERE id = $1
                `
                , [lobbyId]);

            if (res.rows.length > 0 && res.rows[0].leader_socket === socketId){
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
                FROM lobbies_sockets
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

    static async getPlayersInLobby(lobbyId: string): Promise<{ socketId: string, isLeader: boolean}[] | undefined>{
        try {
            const res = await db.query(
                `
                SELECT 
                    lobbies_sockets.socket_id AS socket_id, 
                    (lobbies.leader_socket = lobbies_sockets.socket_id) AS is_leader
                FROM lobbies_sockets
                INNER JOIN lobbies ON lobbies_sockets.lobby_id = lobbies.id
                WHERE lobbies_sockets.lobby_id = $1
                AND lobbies_sockets.player_id IS NULL;
                `, [lobbyId]);
    
            return res.rows.map((row: { socket_id: string, is_leader: boolean}) => ({ socketId: row.socket_id, isLeader: row.is_leader}));
        }
        catch (error) {
            console.error("Error in database.", error);
            return undefined;
        }
    }

    static async getLobbyWithPlayer(socketId: string): Promise<string | undefined>{
        try {
            const res = await db.query(
                `
                SELECT lobby_id 
                FROM lobbies_sockets 
                WHERE socket_id = $1
                `, [socketId]);
    
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
    
    static async removePlayerFromLobby(socketId: string, lobbyId: string): Promise<void | undefined>{
        try {
            await db.query(
                `
                DELETE FROM lobbies_sockets 
                WHERE socket_id = $1 AND lobby_id = $2
                RETURNING lobby_id;
                `
                , [socketId, lobbyId]
            );

            return;
    
        } catch (error) {
            console.error("Error removing a player:", error);
            return undefined
        }
    }

    static async addPlayer(socketId: string, lobbyId: string): Promise<void> {
        try {
            const res = await db.query(
                `
                INSERT INTO lobbies_sockets (lobby_id, socket_id, player_id)
                VALUES ($1, $2, $3)
                ON CONFLICT (socket_id) 
                DO UPDATE SET lobby_id = EXCLUDED.lobby_id;
                `,
                [lobbyId, socketId, null]
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

    static async setPlayerIdInGame(socketId: string, playerId: number): Promise<void> {
        try {
            const res = await db.query(
                `
                UPDATE lobbies_sockets 
                SET player_id = $2
                WHERE socket_id = $1
                `,
                [socketId, playerId]
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