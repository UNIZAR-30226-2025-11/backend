import { createServer } from "http";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { authRouter, protectRoute } from "./auth.js";

export const app = express();
export const server = createServer(app);
export const io = new Server(server);

/** Handle uncaught errors gracefully and return an ISE */
//function handleErrors(
//  error: Error,
//  _req: Request,
//  res: Response,
//  _next: NextFunction,
//) {
//  console.error(error);
//  res
//    .status(500)
//    .send({ message: "Oops, something went wrong from our side..." });
//}

app.use(cors()); // Allow Cross-Origin requests by parsing OPTION requests
app.use(express.json()); // Parse JSON
app.use(cookieParser()); // Parse cookies, store them in req.cookies

app.use(authRouter);

// TODO: Remove
app.route("/hello").get((_req, res) => {
  res.send("Hello world!");
});

// TODO: Remove
app.route("/protected-hello").get(protectRoute, (_req, res) => {
  res.send(
    "Hello world! This route should be only accessible if 'access_token' is set as a cookie and protectRoute validates the token",
  );
});

//app.use(handleErrors); // This runs if an exception is not handled earlier

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
