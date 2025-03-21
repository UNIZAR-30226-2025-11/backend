import { Socket } from "socket.io";
import { LobbyManager } from "../managers/lobbyManager.js";
import { SocketManager } from "../managers/socketManager.js";
import logger from "../config/logger.js";


export const setupDisconnectionHandlers = (socket: Socket) => {

    socket.on("disconnect", async () => {
        
        const username: string = socket.data.user.username;

        logger.info(`User "${username}" disconnected`);

        // Remove the player from the lobby
        await LobbyManager.removePlayer(username);

        SocketManager.removeSocket(username);

    });
};