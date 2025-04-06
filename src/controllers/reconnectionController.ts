import { Socket } from "socket.io";
import { LobbyManager } from "../managers/lobbyManager.js";

export const setupReconnection = async (socket: Socket) => {

    const username: string = socket.data.user.username;
    await LobbyManager.handleReconnection(username);
};