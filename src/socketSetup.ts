import { Server, Socket } from "socket.io";
import { setupLobbyHandlers } from "./controllers/lobbyController.js";
import { setupGameHandlers } from "./controllers/gameController.js";
import { SocketManager } from "./services/socketManager.js"
import { setupDisconnectionHandlers } from "./controllers/disconnectionController.js";

export const setupSocket = (io: Server) => {
    io.on("connection", (socket: Socket) => {
        
        const username: string = socket.data.user.username;
        
        console.log("New connection! ", username);
        // Add socket to the manager
        SocketManager.addSocket(username, socket);

        // Set up lobby-related message handlers
        setupLobbyHandlers(socket);

        // Set up in-game message handlers
        setupGameHandlers(socket);

        // Set up disconnection handlers
        setupDisconnectionHandlers(socket);
    });
};