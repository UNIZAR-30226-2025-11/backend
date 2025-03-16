import { GameObject } from "../models/GameObject.js";
import { socketCommunicationGateway } from "../communication/implementations/socketCommunicationGateway.js"
import { LobbyRepository } from "../repositories/lobbyRepository.js";
import { SocketManager } from "./socketManager.js";
import { Socket } from "socket.io";
import { GameManager } from "./gameManager.js";
import { notifyNewPlayers, notifyLobbyDisband } from "../controllers/lobbyController.js";


export class LobbyManager {

    static lobbiesGames: Map<string, GameObject> = new Map();

    static async removePlayer(username: string): Promise<void> {

        const lobbyId: string | undefined = await LobbyRepository.getLobbyWithPlayer(username);

        if(lobbyId === undefined) {
            console.log("Player not in any lobby!");
            return;
        }

        await LobbyManager.removePlayerFromLobby(username, lobbyId);
        
    }


    /**
     * Create a new lobby with the given number of players and the leader socket.
     * 
     * @param numPlayers Number of players in the lobby
     * @param leaderusername Socket id of the leader of the lobby
     * @returns The id of the lobby created if it was created successfully, undefined otherwise
     */
    static async createLobby(numPlayers: number, leaderusername: string): Promise<string |undefined> {

        // Remove the player from the lobbies where he is leader
        const lobbyId: string | undefined = await LobbyRepository.getLobbyWithPlayer(leaderusername);

        if(lobbyId !== undefined) {
            console.log("Removing the player from the lobby: ", lobbyId);
            await LobbyManager.removePlayerFromLobby(leaderusername, lobbyId);
        }

        // Generate a new random lobby id
        const newLobbyId = this.generateLobbyId();

        // Create new lobby empty
        await LobbyRepository.createLobby(newLobbyId, leaderusername, numPlayers);

        // Add the leader to the players in this lobby
        await LobbyRepository.addPlayer(leaderusername, newLobbyId)

        notifyNewPlayers(newLobbyId);

        return newLobbyId;
    }


    /**
     * Adds the player with the given socket to the lobby with the given id
     * @param username Socket of the player to be added
     * @param lobbyId The id of the lobby to be added
     * @returns 
     */
    static async joinLobby(username: string, lobbyId: string): Promise<boolean> {

        // Remove the player if he is in a lobby
        const lobbyIdPlayer: string | undefined = await LobbyRepository.getLobbyWithPlayer(username);

        if(lobbyIdPlayer !== undefined) {
            console.log("Removing the player from the lobby: ", lobbyIdPlayer);
            await LobbyManager.removePlayerFromLobby(username, lobbyIdPlayer);
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
    
        await LobbyRepository.addPlayer(username, lobbyId);
        notifyNewPlayers(lobbyId);

        return true;
    }

    /**
     * Start the lobby with the given id
     * @param username The socket of the player that wants to start the lobby
     * @param lobbyId The id of the lobby to start
     * 
     * @returns The number of players in the lobby if the lobby was started successfully, undefined otherwise 
     */
    static async startLobby(username: string, lobbyId: string): Promise<number| undefined> {

        // Check if the user is the leader of the lobby
        if (!await LobbyRepository.isLeader(username, lobbyId)) {
            console.log("You are not the leader of the lobby!");
            return undefined;
        }

        // Check if the lobby has already started
        if(await LobbyRepository.isActive(lobbyId)) {
            console.log("Lobby already started!");
            return undefined;
        }

        const lobbyPlayers: { username: string, isLeader: boolean}[] | undefined = await LobbyRepository.getPlayersInLobby(lobbyId);

        if(lobbyPlayers === undefined) {
            console.log("Error getting the players in the lobby!");
            return undefined;
        }

        const lobbySocketsId: string[] = lobbyPlayers.map(player => player.username);
        
        if(lobbySocketsId.length < 2) {
            console.log("Not enough players to start the game!", lobbySocketsId.length);
            return undefined;
        }

        let leaderIdInLobby = -1;

        let comm:socketCommunicationGateway = new socketCommunicationGateway();

        for(let i = 0; i < lobbySocketsId.length; i++) {
            if(lobbySocketsId[i] === username) {
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


    static async removePlayerFromLobby(username: string, lobbyId: string): Promise<void> {

        // Disconnect the player from the started lobbies
        const isActive: boolean = await LobbyRepository.isActive(lobbyId);
        const isLeader: boolean = await LobbyRepository.isLeader(username, lobbyId);

        if(isActive) {
            await GameManager.disconnectPlayer(username, lobbyId);
            return;
        } 

        if(isLeader) {
            await notifyLobbyDisband(lobbyId);
            await LobbyRepository.removeLobby(lobbyId);
            return;
        } else {
            await LobbyRepository.removePlayerFromLobby(username, lobbyId);
            await notifyNewPlayers(lobbyId);
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