import { GameObject } from "../models/GameObject.js";
import { socketCommunicationGateway } from "../communication/implementations/socketCommunicationGateway.js"
import { LobbyRepository } from "../repositories/lobbyRepository.js";
import { SocketManager } from "./socketManager.js";
import { Socket } from "socket.io";
import { GameManager } from "./gameManager.js";
import { notifyNewPlayers, notifyLobbyDisband } from "../controllers/lobbyController.js";
import logger from "../config/logger.js";


export class LobbyManager {

    // Map of lobbies with their game object
    static lobbiesGames: Map<string, GameObject> = new Map();

    /**
     * Remove player if he is in a lobby
     * @param username The username of the player to be removed
     * @returns 
     */
    static async removePlayer(username: string): Promise<void> {

        logger.info(`Removing player ${username} from the lobby if he is in one.`);

        const lobbyId: string | undefined = await LobbyRepository.getLobbyWithPlayer(username);

        if(lobbyId === undefined) {
            logger.info(`Player ${username} is not in a lobby.`);
            return;
        }

        await this.removePlayerFromLobby(username, lobbyId);        
    }


    /**
     * Create a new lobby with the given number of players and the leader socket.
     * 
     * @param numPlayers Number of players in the lobby
     * @param lobbyLeaderUsername Socket id of the leader of the lobby
     * @returns The id of the lobby created if it was created successfully, undefined otherwise
     */
    static async createLobby(numPlayers: number, lobbyLeaderUsername: string): Promise<string|undefined> {

        logger.info(`Creating a new lobby with ${numPlayers} players and leader ${lobbyLeaderUsername}.`);
        
        // Remove the player if he is in a lobby
        await this.removePlayer(lobbyLeaderUsername);

        // Generate a new random lobby id
        const newLobbyId = this.generateLobbyId();

        // Create new lobby empty
        await LobbyRepository.createLobby(newLobbyId, lobbyLeaderUsername, numPlayers);

        // Add the leader to the players in this lobby
        await LobbyRepository.addPlayer(lobbyLeaderUsername, newLobbyId)

        await notifyNewPlayers(newLobbyId);

        return newLobbyId;
    }


    /**
     * Adds the player with the given socket to the lobby with the given id
     * @param username Socket of the player to be added
     * @param lobbyId The id of the lobby to be added
     * @returns 
     */
    static async joinLobby(username: string, lobbyId: string): Promise<boolean> {

        logger.info(`Player ${username} is trying to join lobby ${lobbyId}.`);

       // Remove the player if he is in a lobby
        await this.removePlayer(username);

        // Check if the lobby is started
        if(await LobbyRepository.isActive(lobbyId)) {
            logger.warn(`Lobby ${lobbyId} is already started!`);
            return false
        }

        const max = await LobbyRepository.getMaxPlayers(lobbyId);
        const current = await LobbyRepository.getCurrentNumberOfPlayersInLobby(lobbyId);

        if(max === undefined || current === undefined) {
            logger.error(`Error getting the number of players in the lobby!`);
            return false;
        }

        // Check if the lobby is full
        if(current >= max) {
            logger.warn(`Lobby ${lobbyId} is full!`);
            return false;
        }
    
        await LobbyRepository.addPlayer(username, lobbyId);
        await notifyNewPlayers(lobbyId);

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

        logger.info(`Player ${username} is trying to start lobby ${lobbyId}.`);

        // Check if the user is the leader of the lobby
        if (!await LobbyRepository.isLeader(username, lobbyId)) {
            logger.warn(`Player ${username} is not the leader of the lobby!`);
            return undefined;
        }

        // Check if the lobby has already started
        if(await LobbyRepository.isActive(lobbyId)) {
            logger.warn(`Lobby ${lobbyId} has already started!`);
            return undefined;
        }

        const lobbyPlayers: { username: string, isLeader: boolean}[] | undefined = await LobbyRepository.getPlayersInLobby(lobbyId);

        if(lobbyPlayers === undefined) {
            logger.error(`Error getting the players in the lobby ${lobbyId}!`);
            return undefined;
        }

        const lobbySocketsId: string[] = lobbyPlayers.map(player => player.username);
        
        if(lobbySocketsId.length < 2) {
            logger.warn(`Lobby ${lobbyId} has less than 2 players!`);
            return undefined;
        }

        let leaderIdInLobby = -1;

        const comm:socketCommunicationGateway = new socketCommunicationGateway();

        for(let i = 0; i < lobbySocketsId.length; i++) {
            if(lobbySocketsId[i] === username) {
                leaderIdInLobby = i;
            }
            const socket: Socket | undefined = SocketManager.getSocket(lobbySocketsId[i]);

            if(socket === undefined) {
                logger.error(`Socket ${lobbySocketsId[i]} not found!`);
                return undefined;
            }

            comm.registerPlayer(i, socket);
            await LobbyRepository.setPlayerIdInGame(lobbySocketsId[i], i);
        }

        if(leaderIdInLobby === -1) {
            logger.error(`Leader ${username} not found in the lobby ${lobbyId}!`);
            return undefined;
        }

        const game:GameObject = new GameObject(
            lobbyId,
            lobbySocketsId.length, 
            leaderIdInLobby, 
            comm,
        );

        this.lobbiesGames.set(lobbyId, game);

        await LobbyRepository.startLobby(lobbyId);

        return lobbySocketsId.length;
    }

    /**
     * Safe remove player from the lobby. If he is the leader, the lobby is disbanded. 
     * Otherwise, the player is removed from the lobby.
     * If the lobby is started, the player is disconnected from the game but not removed from the lobby.
     * 
     * @param username The username of the player to be removed
     * @param lobbyId The lobby id from which the player is to be removed
     * @returns 
     */
    static async removePlayerFromLobby(username: string, lobbyId: string): Promise<void> {

        logger.info(`Removing player ${username} from lobby ${lobbyId}.`);

        const isActive: boolean | undefined = await LobbyRepository.isActive(lobbyId);
        const isLeader: boolean | undefined = await LobbyRepository.isLeader(username, lobbyId);

        if(isActive === undefined || isLeader === undefined) {
            logger.error(`Error getting the lobby state!`);
            return;
        }

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

    /**
     * Generate a random id of length 9
     * @returns A random id of length 9
     */
    private static generateRandomId(): string {
        return Math.random().toString(36).substring(2, 11);
    }

    /**
     * Generate a random lobby id until it is unique
     * @returns A unique lobby id
     */
    private static generateLobbyId(): string {
        const candidate = this.generateRandomId();
        // TODO: Check if the id is already in use
        return candidate;
    }

}