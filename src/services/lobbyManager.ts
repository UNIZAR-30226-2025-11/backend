import { GameObject } from "../models/GameObject.js";
import { SocketCommunicationHandler } from "./communication/socketCommunicationHandler.js"
import { LobbyRepository } from "../repositories/lobbyRepository.js";
import { SocketManager } from "./socketManager.js";
import { Socket } from "socket.io";
import { GameManager } from "./gameManager.js";
import { BackendLobbyStateUpdateJSON } from "../api/socketAPI.js";

export class LobbyManager {

    static lobbiesGames: Map<string, GameObject> = new Map();

    static async removePlayer(playerSocketId: string): Promise<void> {

        const lobbyId: string | undefined = await LobbyRepository.getLobbyWithPlayer(playerSocketId);

        if(lobbyId === undefined) {
            console.log("Player not in any lobby!");
            return;
        }

        await LobbyManager.removePlayerFromLobby(playerSocketId, lobbyId);
        
    }

    static async notifyNewPlayers(lobbyId: string): Promise<void> {
        const playersInLobby: {socketId:string, isLeader:boolean}[] | undefined = await LobbyRepository.getPlayersInLobby(lobbyId);

        if(playersInLobby === undefined) {
            console.log("Error getting the players in the lobby!");
            return;
        }

        const msg: BackendLobbyStateUpdateJSON = {
            error: false,
            errorMsg: "",
            players: playersInLobby.map(player => { return { name: player.socketId, isLeader: player.isLeader } }),
            disband: false
        }

        playersInLobby.forEach(player => {
            console.log("Notifying player: ", player.socketId);
            const socket: Socket | undefined = SocketManager.getSocket(player.socketId);

            if(socket === undefined) {
                console.log("Socket not found!");
                return;
            }

            socket.emit("lobby-state", msg);
        });
    }

    static async notifyLobbyDisband(lobbyId: string): Promise<void> {
        const playersInLobby: {socketId:string, isLeader:boolean}[] | undefined = await LobbyRepository.getPlayersInLobby(lobbyId);

        if(playersInLobby === undefined) {
            console.log("Error getting the players in the lobby!");
            return;
        }

        const msg: BackendLobbyStateUpdateJSON = {
            error: false,
            errorMsg: "",
            players: [],
            disband: true,
        }

        playersInLobby.forEach(player => {
            const socket: Socket | undefined = SocketManager.getSocket(player.socketId);

            if(socket === undefined) {
                console.log("Socket not found!");
                return;
            }

            socket.emit("lobby-state", msg);
        });
    }

    /**
     * Create a new lobby with the given number of players and the leader socket.
     * 
     * @param numPlayers Number of players in the lobby
     * @param leaderSocketId Socket id of the leader of the lobby
     * @returns The id of the lobby created if it was created successfully, undefined otherwise
     */
    static async createLobby(numPlayers: number, leaderSocketId: string): Promise<string |undefined> {

        // Remove the player from the lobbies where he is leader
        const lobbyId: string | undefined = await LobbyRepository.getLobbyWithPlayer(leaderSocketId);

        if(lobbyId !== undefined) {
            console.log("Removing the player from the lobby: ", lobbyId);
            await LobbyManager.removePlayerFromLobby(leaderSocketId, lobbyId);
        }

        // Generate a new random lobby id
        const lobby_id = this.generateLobbyId();

        // Create new lobby empty
        await LobbyRepository.createLobby(lobby_id, leaderSocketId, numPlayers);

        // Add the leader to the players in this lobby
        await LobbyRepository.addPlayer(leaderSocketId, lobby_id)

        LobbyManager.notifyNewPlayers(lobby_id);

        return lobby_id;
    }


    /**
     * Adds the player with the given socket to the lobby with the given id
     * @param playerSocketId Socket of the player to be added
     * @param lobbyId The id of the lobby to be added
     * @returns 
     */
    static async joinLobby(playerSocketId: string, lobbyId: string): Promise<boolean> {

        // Remove the player if he is in a lobby
        const lobbyIdPlayer: string | undefined = await LobbyRepository.getLobbyWithPlayer(playerSocketId);

        if(lobbyIdPlayer !== undefined) {
            console.log("Removing the player from the lobby: ", lobbyIdPlayer);
            await LobbyManager.removePlayerFromLobby(playerSocketId, lobbyIdPlayer);
        }

        // Check if the lobby is started
        if(await LobbyRepository.isActive(lobbyId)) {
            console.log("Lobby is started.")
            return false
        }

        const max = await LobbyRepository.getMaxPlayers(lobbyId);
        const current = await LobbyRepository.getCurrentPlayers(lobbyId);

        if(max === undefined || current === undefined) {
            console.log("Error getting the number of players in the lobby!");
            return false;
        }

        // Check if the lobby is full
        if(current >= max) {
            console.log("The lobby is full!");
            return false;
        }
    
        await LobbyRepository.addPlayer(playerSocketId, lobbyId);
        LobbyManager.notifyNewPlayers(lobbyId);

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

        // Check if the user is the leader of the lobby
        if (!await LobbyRepository.isLeader(playerSocketId, lobbyId)) {
            console.log("You are not the leader of the lobby!");
            return undefined;
        }

        // Check if the lobby has already started
        if(await LobbyRepository.isActive(lobbyId)) {
            console.log("Lobby already started!");
            return undefined;
        }

        const lobbyPlayers: { socketId: string, isLeader: boolean}[] | undefined = await LobbyRepository.getPlayersInLobby(lobbyId);

        if(lobbyPlayers === undefined) {
            console.log("Error getting the players in the lobby!");
            return undefined;
        }

        const lobbySocketsId: string[] = lobbyPlayers.map(player => player.socketId);
        
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


    static async removePlayerFromLobby(playerSocketId: string, lobbyId: string): Promise<void> {

        // Disconnect the player from the started lobbies
        const isActive: boolean = await LobbyRepository.isActive(lobbyId);
        const isLeader: boolean = await LobbyRepository.isLeader(playerSocketId, lobbyId);

        if(isActive) {
            await GameManager.disconnectPlayer(playerSocketId, lobbyId);
            return;
        } 

        if(isLeader) {
            await LobbyManager.notifyLobbyDisband(lobbyId);
            await LobbyRepository.removeLobby(lobbyId);
            return;
        } else {
            await LobbyRepository.removePlayerFromLobby(playerSocketId, lobbyId);
            await LobbyManager.notifyNewPlayers(lobbyId);
        }

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