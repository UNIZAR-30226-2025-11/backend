import { Socket } from "socket.io";
import { LobbyManager } from "../services/lobbyManager.js";

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
import { SocketManager } from "../services/socketManager.js";


export async function notifyNewPlayers(lobbyId: string): Promise<void> {
    const playersInLobby: {username:string, isLeader:boolean}[] | undefined = await LobbyRepository.getPlayersInLobby(lobbyId);

    if(playersInLobby === undefined) {
        console.log("Error getting the players in the lobby!");
        return;
    }

    const msg: BackendLobbyStateUpdateJSON = {
        error: false,
        errorMsg: "",
        players: playersInLobby.map(player => { return { name: player.username, isLeader: player.isLeader } }),
        disband: false
    }

    playersInLobby.forEach(player => {
        console.log("Notifying player: ", player.username);
        const socket: Socket | undefined = SocketManager.getSocket(player.username);

        if(socket === undefined) {
            console.log("Socket not found!");
            return;
        }

        socket.emit("lobby-state", msg);
    });
}

export async function notifyLobbyDisband(lobbyId: string): Promise<void> {
    const playersInLobby: {username:string, isLeader:boolean}[] | undefined = await LobbyRepository.getPlayersInLobby(lobbyId);

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
        const socket: Socket | undefined = SocketManager.getSocket(player.username);

        if(socket === undefined) {
            console.log("Socket not found!");
            return;
        }

        socket.emit("lobby-state", msg);
    });
}


export const setupLobbyHandlers = (socket: Socket) => {

    socket.on("create-lobby", async (data: FrontendCreateLobbyJSON) => {
        
        handleError(data.error, data.errorMsg);
        
        if (data.maxPlayers === undefined) {
            const response: BackendCreateLobbyResponseJSON = {
                error: true,
                errorMsg: "Number of players not provided!",
                lobbyId: ""
            };
            socket.emit("create-lobby", response);
            return;
        }

        // Check if the number of maximum players is valid
        if (data.maxPlayers < 2 || data.maxPlayers > 4) {
            const response: BackendCreateLobbyResponseJSON = {
                error: true,
                errorMsg: "Number of players must be between 2 and 4!",
                lobbyId: ""
            };
            socket.emit("create-lobby", response);
            return;
        }   

        const username: string = socket.data.user.username;
        // Create a new lobby
        const lobbyId: string | undefined = await LobbyManager.createLobby(data.maxPlayers, username);

        if (lobbyId === undefined) {
            
            const response: BackendCreateLobbyResponseJSON = {
                error: true,
                errorMsg: "Could not create the lobby!",
                lobbyId: ""
            };
            socket.emit("create-lobby", response);
            return;
        }

        const response: BackendCreateLobbyResponseJSON = {
            error: false,
            errorMsg: "",
            lobbyId: lobbyId
        };
        socket.emit("create-lobby", response);
        console.log(`Lobby created with ID: ${lobbyId}`);
    });

    socket.on("join-lobby", async (data: FrontendJoinLobbyJSON)  => {

        const username: string = socket.data.user.username;
        handleError(data.error, data.errorMsg);

        if (data.lobbyId === undefined || data.lobbyId === "") {
            const response: BackendJoinLobbyResponseJSON = {
                error: true,
                errorMsg: "No lobby id provided!",
                lobbyId: data.lobbyId
            };
            socket.emit("join-lobby", response);
            return;
        }

        // Check if can join the lobby
        const ok: boolean = await LobbyManager.joinLobby(username, data.lobbyId)
        if (!ok) {
            const response: BackendJoinLobbyResponseJSON = {
                error: true,
                errorMsg: `You cannot join the lobby`,
                lobbyId: data.lobbyId
            };
            socket.emit("join-lobby", response);
            return;
        }

        const response: BackendJoinLobbyResponseJSON = {
            error: false,
            errorMsg: "",
            lobbyId: data.lobbyId
        };
        socket.emit("join-lobby", response);

        console.log(`User joined lobby with ID: ${data.lobbyId}`);
    });

    socket.on("start-lobby", async (data: FrontendStartLobbyJSON) => {

        const username: string = socket.data.user.username;
        handleError(data.error, data.errorMsg);

        if (data.lobbyId === undefined || data.lobbyId === "") {
            const response: BackendStartLobbyResponseJSON = {
                error: true,
                errorMsg: "No lobby id provided!",
                numPlayers: -1
            };
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
            socket.emit("start-lobby", response);
            return;
        }

        const response: BackendStartLobbyResponseJSON = {
            error: false,
            errorMsg: "",
            numPlayers: numberOfPlayersInLobby
        };
        socket.emit("start-lobby", response);
    
        console.log(`Game started in lobby with ID: ${data.lobbyId}`);
    });

};