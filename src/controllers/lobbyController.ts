import { Socket } from "socket.io";
import { LobbyManager } from "../managers/lobbyManager.js";

import { 
    BackendCreateLobbyResponseJSON, 
    FrontendCreateLobbyJSON,
    FrontendJoinLobbyJSON,
    BackendJoinLobbyResponseJSON,
    FrontendStartLobbyJSON,
    BackendStartLobbyResponseJSON,
    BackendLobbyStateUpdateJSON
} from "../api/socketAPI.js";
import { handleError } from "../constants/constants.js";
import { LobbyRepository } from "../repositories/lobbyRepository.js";
import { SocketManager } from "../managers/socketManager.js";
import logger from "../config/logger.js";


export async function notifyNewPlayers(lobbyId: string): Promise<void> {
    const playersInLobby: {username:string, isLeader:boolean}[] = await LobbyRepository.getPlayersInLobby(lobbyId);

    const msg: BackendLobbyStateUpdateJSON = {
        error: false,
        errorMsg: "",
        players: playersInLobby.map(player => { return { name: player.username, isLeader: player.isLeader } }),
        disband: false
    }

    playersInLobby.forEach(player => {
        const socket: Socket | undefined = SocketManager.getSocket(player.username);

        if(socket === undefined) {
            logger.error("Socket not found!");
            return;
        }

        logger.debug(`Sending "lobby-state" message to ${player.username}:\t%j`, msg);

        socket.emit("lobby-state", msg);
    });
}

export async function notifyLobbyDisband(lobbyId: string): Promise<void> {
    const playersInLobby: {username:string, isLeader:boolean}[] = await LobbyRepository.getPlayersInLobby(lobbyId);

    const msg: BackendLobbyStateUpdateJSON = {
        error: false,
        errorMsg: "",
        players: [],
        disband: true,
    }

    playersInLobby.forEach(player => {
        const socket: Socket | undefined = SocketManager.getSocket(player.username);

        if(socket === undefined) {
            logger.error("Socket not found!");
            return;
        }

        logger.debug(`Sending "lobby-state" message to ${player.username}:\t%j`, msg);

        socket.emit("lobby-state", msg);
    });
}


export const setupLobbyHandlers = (socket: Socket) => {

    socket.on("create-lobby", async (data: FrontendCreateLobbyJSON) => {
        
        const username: string = socket.data.user.username;

        logger.info(`Create lobby request received from user: ${username}`);
        logger.debug(`Data received for "create-lobby" request:\t%j`, data);

        handleError(data.error, data.errorMsg);
        
        if (data.maxPlayers === undefined) {

            logger.warn(`Number of players not provided!`);

            const response: BackendCreateLobbyResponseJSON = {
                error: true,
                errorMsg: "Number of players not provided!",
                lobbyId: ""
            };
            
            logger.debug(`Sending response "create-lobby":\t%j`, response);

            socket.emit("create-lobby", response);
            return;
        }

        // Check if the number of maximum players is valid
        if (data.maxPlayers < 2 || data.maxPlayers > 4) {

            logger.warn(`Number of players must be between 2 and 4!`);

            const response: BackendCreateLobbyResponseJSON = {
                error: true,
                errorMsg: "Number of players must be between 2 and 4!",
                lobbyId: ""
            };

            logger.debug(`Sending response: `, response);

            socket.emit("create-lobby", response);
            return;
        }   

        // Create a new lobby
        const lobbyId: string | undefined = await LobbyManager.createLobby(data.maxPlayers, username);

        if (lobbyId === undefined) {

            const response: BackendCreateLobbyResponseJSON = {
                error: true,
                errorMsg: "Could not create the lobby!",
                lobbyId: ""
            };

            logger.debug(`Sending response "create-lobby":\t%j`, response);

            socket.emit("create-lobby", response);
            return;
        }

        logger.info(`Lobby created with ID: ${lobbyId}`);

        const response: BackendCreateLobbyResponseJSON = {
            error: false,
            errorMsg: "",
            lobbyId: lobbyId
        };

        logger.debug(`Sending response "create-lobby":\t%j`, response);

        socket.emit("create-lobby", response);
        return;
    });

    socket.on("join-lobby", async (data: FrontendJoinLobbyJSON)  => {

        const username: string = socket.data.user.username;

        logger.info(`Join lobby request received from user: ${username}`);
        logger.debug(`Data received for "join-lobby" request:\t%j`, data);

        handleError(data.error, data.errorMsg);

        if (data.lobbyId === undefined || data.lobbyId === "") {

            logger.warn(`No lobby id provided!`);
            const response: BackendJoinLobbyResponseJSON = {
                error: true,
                errorMsg: "No lobby id provided!",
                lobbyId: data.lobbyId
            };

            logger.debug(`Sending response "join-lobby":\t%j`, response);

            socket.emit("join-lobby", response);
            return;
        }

        // Check if the lobby exists
        if (!await LobbyManager.lobbyExists(data.lobbyId)) {
            
            logger.warn(`Lobby ${data.lobbyId} does not exist!`);
            const response: BackendJoinLobbyResponseJSON = {
                error: true,
                errorMsg: `Lobby ${data.lobbyId} does not exist`,
                lobbyId: data.lobbyId
            };

            logger.debug(`Sending response "join-lobby":\t%j`, response);

            socket.emit("join-lobby", response);
            return;
        }

        if(! await LobbyManager.playerIsInLobby(username, data.lobbyId)) {
            
            logger.warn(`Player ${username} is already in a lobby!`);
            const response: BackendJoinLobbyResponseJSON = {
                error: true,
                errorMsg: `You are already in a lobby`,
                lobbyId: data.lobbyId
            };
            
            logger.debug(`Sending response "join-lobby":\t%j`, response);

            socket.emit("join-lobby", response);
            return;
        }

        
        // Check if can join the lobby
        if (!await LobbyManager.joinLobby(username, data.lobbyId)) {

            const response: BackendJoinLobbyResponseJSON = {
                error: true,
                errorMsg: `You cannot join the lobby`,
                lobbyId: data.lobbyId
            };

            logger.debug(`Sending response "join-lobby":\t%j`, response);

            socket.emit("join-lobby", response);
            return;
        }

        const response: BackendJoinLobbyResponseJSON = {
            error: false,
            errorMsg: "",
            lobbyId: data.lobbyId
        };

        logger.debug(`Sending response "join-lobby":\t%j`, response);

        socket.emit("join-lobby", response);

    });

    socket.on("start-lobby", async (data: FrontendStartLobbyJSON) => {

        const username: string = socket.data.user.username;

        logger.info(`Start lobby request received from user: ${username}`);
        logger.debug(`Data received for "start-lobby" request:\t%j`, data);

        handleError(data.error, data.errorMsg);

        if (data.lobbyId === undefined || data.lobbyId === "") {

            logger.warn(`No lobby id provided!`);
            const response: BackendStartLobbyResponseJSON = {
                error: true,
                errorMsg: "No lobby id provided!",
                numPlayers: -1
            };

            logger.debug(`Sending response "start-lobby":\t%j`, response);

            socket.emit("start-lobby", response);
            return;
        }

        // Check if the lobby exists
        if (!await LobbyManager.lobbyExists(data.lobbyId)) {
            
            logger.warn(`Lobby ${data.lobbyId} does not exist!`);
            const response: BackendStartLobbyResponseJSON = {
                error: true,
                errorMsg: `Lobby ${data.lobbyId} does not exist`,
                numPlayers: -1
            };

            logger.debug(`Sending response "start-lobby":\t%j`, response);

            socket.emit("start-lobby", response);
            return;
        }

        const numberOfPlayersInLobby : number|undefined = await LobbyManager.startLobby(username, data.lobbyId);
        
        if(numberOfPlayersInLobby === undefined) {
            const response: BackendStartLobbyResponseJSON = {
                error: true,
                errorMsg: "You cannot start the lobby",
                numPlayers: -1
            };

            logger.debug(`Sending response "start-lobby":\t%j`, response);

            socket.emit("start-lobby", response);
            return;
        }

        const response: BackendStartLobbyResponseJSON = {
            error: false,
            errorMsg: "",
            numPlayers: numberOfPlayersInLobby
        };

        logger.debug(`Sending response "start-lobby":\t%j`, response);

        socket.emit("start-lobby", response);

    });

};