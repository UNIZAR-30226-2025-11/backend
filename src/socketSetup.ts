import { Server, Socket } from "socket.io";
import { setupLobbyHandlers } from "./controllers/lobbyController.js";
import { setupGameHandlers } from "./controllers/gameController.js";
import { SocketManager } from "./services/socketManager.js"

export const setupSocket = (io: Server) => {
    io.on("connection", (socket: Socket) => {
    
        console.log("New connection! ", socket.id);

        // Add socket to the manager
        SocketManager.addSocket(socket.id, socket);

        // Set up lobby-related message handlers
        setupLobbyHandlers(socket);

        // Set up in-game message handlers
        setupGameHandlers(socket);
    });
};