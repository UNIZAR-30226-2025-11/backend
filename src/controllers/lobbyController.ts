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
import { FrontendCreateLobbyJSONSchema, FrontendJoinLobbyJSONSchema, FrontendStartLobbyJSONSchema } from "../schemas/socketAPI.js";
import eventBus from "../events/eventBus.js";
import { GameEvents } from "../events/gameEvents.js";



export const setupLobbyHandlers = (socket: Socket) => {

    socket.on("create-lobby", async (data: unknown) => {
        
        const username: string = socket.data.user.username;

        logger.info(`Create lobby request received from user: ${username}`);
        logger.debug(`Data received for "create-lobby" request:\t%j`, data);

        const parsed = FrontendCreateLobbyJSONSchema.safeParse(data);

        if (!parsed.success) {
            logger.warn(`Invalid JSON: ${parsed.error}`);

            const response: BackendCreateLobbyResponseJSON = {
                error: true,
                errorMsg: `Error ${parsed.error} in data sent.`,
                lobbyId: ""
            };
            
            logger.debug(`Sending response "create-lobby":\t%j`, response);
            socket.emit("create-lobby", response);
            return;
        }

        const createLobbyData: FrontendCreateLobbyJSON = parsed.data as FrontendCreateLobbyJSON;

        handleError(createLobbyData.error, createLobbyData.errorMsg);
        
        // Check if the number of maximum players is valid
        if (createLobbyData.maxPlayers < 2 || createLobbyData.maxPlayers > 4) {

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
        const lobbyId: string | undefined = await LobbyManager.createLobby(createLobbyData.maxPlayers, username);

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

    socket.on("join-lobby", async (data: unknown)  => {

        const username: string = socket.data.user.username;

        logger.info(`Join lobby request received from user: ${username}`);
        logger.debug(`Data received for "join-lobby" request:\t%j`, data);

        const parsed = FrontendJoinLobbyJSONSchema.safeParse(data);

        if (!parsed.success) {
            logger.warn(`Invalid JSON: ${parsed.error}`);

            const response: BackendJoinLobbyResponseJSON = {
                error: true,
                errorMsg: `Error ${parsed.error} in data sent.`,
                lobbyId: ""
            };

            logger.debug(`Sending response "join-lobby" to ${username}:\t%j`, response);
            socket.emit("join-lobby", response);
            return;
        }

        const joinLobbyData: FrontendJoinLobbyJSON = parsed.data as FrontendJoinLobbyJSON;

        handleError(joinLobbyData.error, joinLobbyData.errorMsg);

        // Check if the lobby exists
        if (!await LobbyManager.lobbyExists(joinLobbyData.lobbyId)) {
            
            logger.warn(`Lobby ${joinLobbyData.lobbyId} does not exist!`);
            const response: BackendJoinLobbyResponseJSON = {
                error: true,
                errorMsg: `Lobby ${joinLobbyData.lobbyId} does not exist`,
                lobbyId: joinLobbyData.lobbyId
            };

            logger.debug(`Sending response "join-lobby":\t%j`, response);

            socket.emit("join-lobby", response);
            return;
        }

        if(await LobbyManager.playerIsInLobby(username, joinLobbyData.lobbyId)) {
            
            logger.warn(`Player ${username} is already in a lobby!`);
            const response: BackendJoinLobbyResponseJSON = {
                error: true,
                errorMsg: `You are already in a lobby`,
                lobbyId: joinLobbyData.lobbyId
            };
            
            logger.debug(`Sending response "join-lobby":\t%j`, response);

            socket.emit("join-lobby", response);
            return;
        }

        // Check if can join the lobby
        if (!await LobbyManager.joinLobby(username, joinLobbyData.lobbyId)) {

            const response: BackendJoinLobbyResponseJSON = {
                error: true,
                errorMsg: `You cannot join the lobby`,
                lobbyId: joinLobbyData.lobbyId
            };

            logger.debug(`Sending response "join-lobby":\t%j`, response);

            socket.emit("join-lobby", response);
            return;
        }

        const response: BackendJoinLobbyResponseJSON = {
            error: false,
            errorMsg: "",
            lobbyId: joinLobbyData.lobbyId
        };

        logger.debug(`Sending response "join-lobby":\t%j`, response);

        socket.emit("join-lobby", response);

    });

    socket.on("start-lobby", async (data: unknown) => {

        const username: string = socket.data.user.username;

        logger.info(`Start lobby request received from user: ${username}`);
        logger.debug(`Data received for "start-lobby" request:\t%j`, data);
        
        const parsed = FrontendStartLobbyJSONSchema.safeParse(data);

        if (!parsed.success) {
            logger.warn(`Invalid JSON: ${parsed.error}`);

            const response: BackendStartLobbyResponseJSON = {
                error: true,
                errorMsg: `Error ${parsed.error} in data sent.`,
                numPlayers: -1
            };

            logger.debug(`Sending response "start-lobby" to ${username}:\t%j`, response);
            socket.emit("start-lobby", response);
            return;
        }

        const startLobbyData: FrontendStartLobbyJSON = parsed.data as FrontendStartLobbyJSON;

        handleError(startLobbyData.error, startLobbyData.errorMsg);

        // Check if the lobby exists
        if (!await LobbyManager.lobbyExists(startLobbyData.lobbyId)) {
            
            logger.warn(`Lobby ${startLobbyData.lobbyId} does not exist!`);
            const response: BackendStartLobbyResponseJSON = {
                error: true,
                errorMsg: `Lobby ${startLobbyData.lobbyId} does not exist`,
                numPlayers: -1
            };

            logger.debug(`Sending response "start-lobby":\t%j`, response);

            socket.emit("start-lobby", response);
            return;
        }

        const numberOfPlayersInLobby : number|undefined = await LobbyManager.startLobby(username, startLobbyData.lobbyId);
        
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

eventBus.on(GameEvents.LOBBY_DISBAND, async (lobbyId: string) => {
    const playersInLobby: {username:string, isLeader:boolean}[] = await LobbyRepository.getPlayersInLobbyBeforeStart(lobbyId);

    const msg: BackendLobbyStateUpdateJSON = {
        error: false,
        errorMsg: "",
        players: [],
        disband: true,
        lobbyId: lobbyId
    }

    playersInLobby.forEach(player => {
        const socket: Socket | undefined = SocketManager.getSocket(player.username);

        if(socket === undefined) {
            logger.warn("Socket not found!");
            return;
        }

        logger.debug(`Sending "lobby-state" message to ${player.username}:\t%j`, msg);

        socket.emit("lobby-state", msg);
    });
});

eventBus.on(GameEvents.NEW_PLAYERS_LOBBY, async (lobbyId: string) => {
    const playersInLobby: {username:string, isLeader:boolean}[] = await LobbyRepository.getPlayersInLobbyBeforeStart(lobbyId);

    const msg: BackendLobbyStateUpdateJSON = {
        error: false,
        errorMsg: "",
        players: playersInLobby.map(player => { return { name: player.username, isLeader: player.isLeader } }),
        disband: false,
        lobbyId: lobbyId
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
});