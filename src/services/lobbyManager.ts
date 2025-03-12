import { GameObject } from "../models/GameObject.js";
import { SocketCommunicationHandler } from "./communication/socketCommunicationHandler.js"
import { LobbyRepository } from "../repositories/lobbyRepository.js";
import { SocketManager } from "./socketManager.js";
import { Socket } from "socket.io";

import { BackendLobbyStartedJSON } from "../api/socketAPI.js";

export class LobbyManager {

    static lobbiesGames: Map<string, GameObject> = new Map();

    /**
     * Create a new lobby with the given number of players and the leader socket.
     * 
     * @param num_players Number of players in the lobby
     * @param leader_socket_id Socket id of the leader of the lobby
     * @returns The id of the lobby created if it was created successfully, undefined otherwise
     */
    static async createLobby(num_players: number, leader_socket_id: string): Promise<string |undefined> {

        // Generate a new random lobby id
        const lobby_id = this.generateLobbyId();
        
        // Create new lobby empty
        await LobbyRepository.createLobby(lobby_id, leader_socket_id, num_players);

        // Add the leader to the players in this lobby
        await LobbyRepository.addPlayer(leader_socket_id, lobby_id)

        return lobby_id;
    }


    /**
     * Adds the player with the given socket to the lobby with the given id
     * @param player_socket_id Socket of the player to be added
     * @param lobby_id The id of the lobby to be added
     * @returns 
     */
    static async joinLobby(player_socket_id: string, lobby_id: string): Promise<boolean> {

        // Check if the lobby is started
        if(await LobbyRepository.isStarted(lobby_id)) {
            console.log("Lobby is started.")
            return false
        }
        const max = await LobbyRepository.getMaxPlayers(lobby_id);
        const current = await LobbyRepository.getCurrentPlayers(lobby_id);

        if(max === undefined || current === undefined) {
            console.log("Error getting the number of players in the lobby!");
            return false;
        }

        // Check if the lobby is full
        if(current >= max) {
            console.log("The lobby is full!");
            return false;
        }
    
        LobbyRepository.addPlayer(player_socket_id, lobby_id);
        return true;
    }

    /**
     * Start the lobby with the given id
     * @param playerSocketId The socket of the player that wants to start the lobby
     * @param lobbyId The id of the lobby to start
     * 
     * @returns The number of players in the lobby if the lobby was started successfully, undefined otherwise 
     */
    static async startLobby(playerSocketId: string, lobbyId: string): Promise<number| undefined> {

        const lobbySocketsId: string[] = await LobbyRepository.getPlayersInLobby(lobbyId);
        
        // Check if the user is the leader of the lobby
        if (!await LobbyRepository.isLeader(playerSocketId, lobbyId)) {
            console.log("You are not the leader of the lobby!");
            return undefined;
        }

        // Check if the lobby has already started
        if(await LobbyRepository.isStarted(lobbyId)) {
            console.log("Lobby already started!");
            return undefined;
        }

        if(lobbySocketsId.length < 2) {
            console.log("Not enough players to start the game!", lobbySocketsId.length);
            return undefined;
        }

        let leaderIdInLobby = -1;

        let comm:SocketCommunicationHandler = new SocketCommunicationHandler();

        for(let i = 0; i < lobbySocketsId.length; i++) {
            if(lobbySocketsId[i] === playerSocketId) {
                leaderIdInLobby = i;
            }
            const socket: Socket | undefined = SocketManager.getSocket(lobbySocketsId[i]);

            if(socket === undefined) {
                console.log("Socket not found!");
                return undefined;
            }

            const msg: BackendLobbyStartedJSON = {
                error: false,
                errorMsg: "",
                playerId: i,
                lobbyId: lobbyId,
                isLeader: i === leaderIdInLobby
            };

            socket.emit("lobby-started", msg);

            comm.registerPlayer(i, socket);
            LobbyRepository.setPlayerIdInGame(lobbySocketsId[i], i);
        }

        if(leaderIdInLobby === -1) {
            console.log("Leader not found!");
            return undefined;
        }

        const game:GameObject = new GameObject(
            lobbyId,
            lobbySocketsId.length, 
            leaderIdInLobby, 
            comm,
        );

        LobbyManager.lobbiesGames.set(lobbyId, game);

        LobbyRepository.startLobby(lobbyId, game);

        return lobbySocketsId.length;
    }

    /**
     * Remove the player with the given socket from the lobby
     * @param player_socket_id Socket of the player to remove from the lobby
     * @returns 
     */
    static async removePlayerFromLobby(player_socket_id: string): Promise<void> {
        LobbyRepository.removePlayer(player_socket_id);
        return;
    }

    // ----------------------------------------------------------
    // Private methods

    private static generateRandomId(): string {
        return Math.random().toString(36).substring(2, 11);
    }

    private static generateLobbyId(): string {
        let candidate = this.generateRandomId();
        return candidate;
    }

}