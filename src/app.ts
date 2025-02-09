import { createServer } from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";

export const app = express();
export const server = createServer(app);
export const io = new Server(server);

app.use(cors()); // Allow Cross-Origin requests by parsing OPTION requests
app.use(express.json()); // Parse JSON
app.use(cookieParser()); // Parse cookies, store them in req.cookies

app.route("/hello").get((_req, res) => {
  res.send("Hello world!");
});

io.on("connect", (socket) => {
  console.log(`Connected: ${socket.id}`);

  // https://socket.io/docs/v4/emitting-events/

  // Basic emit
  socket.on("hello-req", () => {
    socket.emit("hello-res", "Hello world");
  });

  // Emit with ack
  socket.on("hello", (callback) => {
    callback("Hello world");
  });

  socket.on("disconnect", () => {
    console.log(`Disconnected: ${socket.id}`);
  });
});
