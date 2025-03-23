import { Socket } from "socket.io";
import { LobbyManager } from "../managers/lobbyManager.js";

export const setupReconnection = (socket: Socket) => {

    const username: string = socket.data.user.username;
    LobbyManager.handleReconnection(username);
};