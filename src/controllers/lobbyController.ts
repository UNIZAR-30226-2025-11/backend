import { Socket } from "socket.io";
import { LobbyManager } from "../services/lobbyManager.js";

import { 
    BackendCreateLobbyResponseJSON, 
    FrontendCreateLobbyJSON,
    FrontendJoinLobbyJSON,
    BackendJoinLobbyResponseJSON,
    FrontendStartLobbyJSON,
    BackendStartLobbyResponseJSON
} from "../api/socketAPI.js";
import { handleError } from "../constants/constants.js";


export const setupLobbyHandlers = (socket: Socket) => {

    socket.on("create-lobby", async (data: FrontendCreateLobbyJSON) => {
        
        handleError(data.error, data.errorMsg);
        console.log("Create lobby message received!", data);
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

        
        // Create a new lobby
        const lobby_id: string | undefined = await LobbyManager.createLobby(data.maxPlayers, socket.id);

        if (lobby_id === undefined) {
            
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
            lobbyId: lobby_id
        };
        socket.emit("create-lobby", response);
        console.log(`Lobby created with ID: ${lobby_id}`);
    });

    socket.on("join-lobby", async (data: FrontendJoinLobbyJSON)  => {

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
        const ok: boolean = await LobbyManager.joinLobby(socket.id, data.lobbyId)
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

        const numberOfPlayersInLobby : number|undefined = await LobbyManager.startLobby(socket.id, data.lobbyId);
        
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