import { Socket } from "socket.io";
import { LobbyManager } from "../services/lobbyManager.js";
import { SocketManager } from "../services/socketManager.js";


export const setupDisconnectionHandlers = (socket: Socket) => {

    socket.on("disconnect", async () => {
        
        console.log("User disconnected!");

        const username: string = socket.data.user.username;

        // Remove the player from the lobby
        await LobbyManager.removePlayer(username);

        SocketManager.removeSocket(username);

        console.log("User disconnected!");
    });
};