import { db } from "../db.js";
import { GameObject } from "../models/GameObject.js";

export class LobbyRepository {
    
    static async createLobby(lobby_id: string, leader_socket: string, num_max_players: number): Promise<void> {
        await db.query(
            "INSERT INTO lobbies (id, game, leader_socket, num_max_players) VALUES ($1, $2, $3, $4)",
            [lobby_id, null, leader_socket, num_max_players]
        );
    }

    static async removeLobby(lobby_id: string): Promise<void> {
        try {
            const res = await db.query(
                `
                DELETE FROM lobbies 
                WHERE id = $1
                `, [lobby_id]
            );

            if (res.rows.length > 0) {
            } else {
                console.log("Error removing lobby.")
            }

        } catch (error) {
            console.error("Error in database.", error);
            throw new Error("Error in database");
        }
    }
    
    static async isStarted(lobby_id: string): Promise<boolean> {
        try {
            const res = await db.query(
                `
                SELECT active 
                FROM lobbies 
                WHERE id = $1
                `
                , [lobby_id]);
    
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

    static async startLobby(lobby_id: string, game:GameObject): Promise<void> {
        try {
            await db.query(
                `
                UPDATE lobbies
                SET active = TRUE, game=$2
                WHERE id = $1
                `, [lobby_id, game.toJSON()]
            );
        }
        catch (error) {
            console.error("Error in database.", error);
            throw new Error("Error in database");
        }
    }
    
    static async isLeader(socket_id: string, lobby_id: string): Promise<boolean>{
        try {
            const res = await db.query(
                `
                SELECT leader_socket 
                FROM lobbies
                WHERE id = $1
                `
                , [lobby_id]);

            if (res.rows.length > 0 && res.rows[0].leader_socket === socket_id){
                return true;
            }else{
                return false;
            }
    
        } catch (error) {
            console.error("Error in database.", error);
            throw new Error("Error in database");
        }
    }

    static async getMaxPlayers(lobby_id: string): Promise<number | undefined>{
        try {
            const res = await db.query(
                `SELECT num_max_players
                FROM lobbies
                WHERE id = $1`
                , [lobby_id]);
            
                if (res.rows.length > 0 ){
                    return res.rows[0].num_max_players;
                }else{
                    return undefined;
                }
    
        } catch (error) {
            console.error("Error removing a player:", error);
        }
    }

    static async getCurrentPlayers(lobby_id: string): Promise<number | undefined>{
        try{
            const res = await db.query(
                `SELECT COUNT(*) as num
                FROM lobbies_sockets
                WHERE lobby_id = $1`
                , [lobby_id]);
            
            if (res.rows.length > 0 ){
                return res.rows[0].num;
            }else{
                return undefined;
            }

        } catch (error) {
            console.error("Error removing a player:", error);
        }
    }
    
    static async removePlayer(socket_id: string): Promise<void> {
        try {
            await db.query(
                `DELETE FROM lobbies_sockets 
                WHERE socket_id = $1`
                , [socket_id]);
    
        } catch (error) {
            console.error("Error removing a player:", error);
        }
    }

    static async addPlayer(socket_id: string, lobby_id: string): Promise<boolean> {
        try {
            const res = await db.query(
                `
                INSERT INTO lobbies_sockets (lobby_id, socket_id, player_id)
                VALUES ($1, $2, $3)
                ON CONFLICT (socket_id) 
                DO UPDATE SET lobby_id = EXCLUDED.lobby_id;
                `,
                [lobby_id, socket_id, null]
            );
            
            if (res.rowCount && res.rowCount > 0) {
                console.log("Player added");
            } else {
                console.log("Cannot add player.");
            }

            return true;
    
        } catch (error) {
            console.error("Error in database.", error);
            throw new Error("Error in database");
        }
    }

    static async setPlayerIdInGame(socket_id: string, player_id: number): Promise<void> {
        try {
            const res = await db.query(
                `
                UPDATE lobbies_sockets 
                SET player_id = $2
                WHERE socket_id = $1
                `,
                [socket_id, player_id]
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

    static async isInAnyLobby(socket_id: string): Promise<boolean>{
        try {
            const res = await db.query(
                `
                SELECT player_id 
                FROM lobbies_sockets 
                WHERE socket_id = $1
                `, [socket_id]);
    
            if (res.rows.length > 0) {
                return true
            } else {
                return false;
            }
        } catch (error) {
            console.error("Error in database.", error);
            throw new Error("Error in database");
        }
    }

    static async getPlayersInLobby(lobby_id: string): Promise<string[]>{
        try {
            const res = await db.query(
                `
                SELECT socket_id 
                FROM lobbies_sockets 
                WHERE lobby_id = $1
                AND player_id is NULL
                `, [lobby_id]);
    
            return res.rows.map((row: { socket_id: string }) => row.socket_id);

        } catch (error) {
            console.error("Error in database.", error);
            throw new Error("Error in database");
        }
    }
}