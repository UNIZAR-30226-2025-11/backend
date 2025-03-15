import { Socket } from "socket.io";
import { LobbyManager } from "../services/lobbyManager.js";
import { SocketManager } from "../services/socketManager.js";


export const setupDisconnectionHandlers = (socket: Socket) => {

    socket.on("disconnect", async () => {
        
        console.log("User disconnected!");
        // Remove the player from the lobby
        await LobbyManager.removePlayer(socket.id);

        SocketManager.removeSocket(socket.id);

        console.log("User disconnected!");
    });
};