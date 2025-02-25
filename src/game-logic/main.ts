import { createServer } from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";

import { GameObject } from "./objects.js";
import { CallSystem, Terminal } from './calls.js';

export const app = express();
export const server = createServer(app);
export const io = new Server(server);

app.use(cors()); // Allow Cross-Origin requests by parsing OPTION requests
app.use(express.json()); // Parse JSON
app.use(cookieParser()); // Parse cookies, store them in req.cookies

const socket_players = new Map();

//app.use(handleErrors); // This runs if an exception is not handled earlier

io.on("connect", (socket) => {
    console.log(`Connected: ${socket.id}`);

    if (socket_players.size >= 4) {
        socket.emit('room_full', { message: 'La sala está llena. Intenta más tarde.' });
        socket.disconnect();
        return;
    }

    socket_players.set(socket.id, socket);

    if (socket_players.size >= 2) {
        console.log('Beginning game..');
        main(); 
    }

    socket.on("disconnect", () => {
        console.log(`Disconnected: ${socket.id}`);
        socket_players.delete(socket.id);
    });
});


function main() {
    const gameObject = new GameObject(0, 3, socket_players);

    gameObject.play_turn();

}
