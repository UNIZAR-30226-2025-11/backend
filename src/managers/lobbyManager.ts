import { GameObject } from "../models/GameObject.js";
import { socketCommunicationGateway } from "../communication/implementations/socketCommunicationGateway.js"
import { LobbyRepository } from "../repositories/lobbyRepository.js";
import { GameManager } from "./gameManager.js";
import logger from "../config/logger.js";
import { GameEvents } from "../events/gameEvents.js";
import eventBus from "../events/eventBus.js";


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
            logger.verbose(`Player ${username} is not in a lobby.`);
            return;
        }

        await this.removePlayerFromLobby(username, lobbyId);        
    }

    static async getLobbyWithPlayer(username: string): Promise<string | undefined> {
        return await LobbyRepository.getLobbyWithPlayer(username);
    }

    static async deleteLobby(lobbyId: string): Promise<void> {

        logger.info(`Deleting lobby ${lobbyId}.`);

        const usernames: string[] = await LobbyRepository.getPlayersInLobby(lobbyId)
        for (const username of usernames) {
            logger.verbose(`Removing player ${username} from lobby ${lobbyId}.`);
            await LobbyRepository.removePlayerFromLobby(username, lobbyId);
            
            // const socket: Socket | undefined = SocketManager.getSocket(username);
            // if (socket !== undefined) {
            //     SocketManager.removeSocket(username);
            // }
        }

        const game: GameObject | undefined = this.lobbiesGames.get(lobbyId);

        if(game !== undefined) {
            logger.verbose(`Deleting game ${lobbyId} locally.`);
            this.lobbiesGames.delete(lobbyId);
        }  

        logger.verbose(`Removing lobby ${lobbyId} from the database.`);
        await LobbyRepository.removeLobby(lobbyId);
        return
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

        eventBus.emit(GameEvents.NEW_PLAYERS_LOBBY, newLobbyId);

        return newLobbyId;
    }

    static async lobbyExists(lobbyId: string): Promise<boolean> {
        return await LobbyRepository.lobbyExists(lobbyId);
    }

    static async playerIsInLobby(username: string, lobbyId: string): Promise<boolean> {
        const playersInLobby: {username:string, isLeader:boolean}[]  = await LobbyRepository.getPlayersInLobbyBeforeStart(lobbyId);
        return playersInLobby.some(player => player.username === username);
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
        const isActive: boolean | undefined = await LobbyRepository.isActive(lobbyId);

        if(isActive === undefined) {
            logger.error(`Error getting the lobby state!`);
            return false;
        }

        // Check if the lobby is already started
        if(isActive) {
            logger.warn(`Lobby ${lobbyId} is already started!`);
            return false
        }

        const max = await LobbyRepository.getMaxPlayers(lobbyId);
        if(max === undefined) {
            logger.error(`Error getting the maximum number of player in the lobby!`);
            return false;
        }

        const current = await LobbyRepository.getCurrentNumberOfPlayersInLobby(lobbyId);
        if(current === undefined) {
            logger.error(`Error getting the current number of player in the lobby!`);
            return false;
        }

        // Check if the lobby is full
        if(current >= max) {
            logger.warn(`Lobby ${lobbyId} is full!`);
            return false;
        }
    
        await LobbyRepository.addPlayer(username, lobbyId);
        eventBus.emit(GameEvents.NEW_PLAYERS_LOBBY, lobbyId);

        return true;
    }

    /**
     * Start the lobby with the given id
     * @param leaderUsername The socket of the player that wants to start the lobby
     * @param lobbyId The id of the lobby to start
     * 
     * @returns The number of players in the lobby if the lobby was started successfully, undefined otherwise 
     */
    static async startLobby(leaderUsername: string, lobbyId: string): Promise<number| undefined> {

        logger.info(`Player ${leaderUsername} is trying to start lobby ${lobbyId}.`);

        // Check if the user is the leader of the lobby
        if (!await LobbyRepository.isLeader(leaderUsername, lobbyId)) {
            logger.warn(`Player ${leaderUsername} is not the leader of the lobby!`);
            return undefined;
        }

        // Check if the lobby has already started
        if(await LobbyRepository.isActive(lobbyId)) {
            logger.warn(`Lobby ${lobbyId} has already started!`);
            return undefined;
        }

        const lobbyPlayers: { username: string, isLeader: boolean, avatar: string}[] = await LobbyRepository.getPlayersInLobbyBeforeStart(lobbyId);
        const lobbyPlayersUsernames: 
            {username:string, avatar:string}[] = 
            lobbyPlayers.map(player => ({username: player.username, avatar: player.avatar}));
        
            const numPlayers: number = lobbyPlayers.length;

        if(numPlayers < 2) {
            logger.warn(`Lobby ${lobbyId} has less than 2 players!`);
            return undefined;
        }

        const comm:socketCommunicationGateway = new socketCommunicationGateway(lobbyId);

        for(let i = 0; i < numPlayers; i++) {
            comm.registerPlayer(lobbyPlayersUsernames[i].username);
            await LobbyRepository.setPlayerIdInGame(lobbyPlayersUsernames[i].username, i);
        }

        const game:GameObject = new GameObject(
            lobbyId,
            numPlayers, 
            lobbyPlayersUsernames,
            leaderUsername, 
            comm,
        );

        this.lobbiesGames.set(lobbyId, game);

        await LobbyRepository.startLobby(lobbyId);

        return numPlayers;
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
            // If the player is the leader, disband the lobby
            eventBus.emit(GameEvents.LOBBY_DISBAND, lobbyId);
            await LobbyRepository.removeLobby(lobbyId);
            return;
        } else {
            // If the player is not the leader, remove him from the lobby
            await LobbyRepository.removePlayerFromLobby(username, lobbyId);
            eventBus.emit(GameEvents.NEW_PLAYERS_LOBBY, lobbyId);
        }

        return;
    }

    static async handleReconnection(username: string): Promise<void> {
        
        logger.verbose(`Handling reconnection for player ${username}.`);
        const lobbyId: string | undefined = await LobbyRepository.getLobbyWithPlayer(username);

        if(lobbyId === undefined) {
            logger.verbose(`Player ${username} is not in a lobby.`);
            return;
        }

        const isActive: boolean | undefined = await LobbyRepository.isActive(lobbyId);

        if(isActive === undefined) {
            logger.error(`Error getting the lobby state!`);
            return;
        }

        if(!isActive){
            logger.verbose(`Player ${username} is in lobby ${lobbyId}.`);
            return;
        }

        const game: GameObject | undefined = this.lobbiesGames.get(lobbyId);

        if(game === undefined) {
            logger.error(`Error getting the game object!`);
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        game.reconnectPlayer(username);
    
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