import { createServer } from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { authRouter } from "./auth/routes.js";
import { usersRouter } from "./users/routes.js";
import { setupSocket } from "./socketSetup.js";
import { FRONTEND_URL, SOCKET_AUT } from "./config.js";
import { protectSocket } from "./auth/middleware.js";

export const app = express();
export const server = createServer(app);
export const io = new Server(server, {
  cors: { origin: FRONTEND_URL, credentials: true },
});

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

// Allow Cross-Origin requests by parsing OPTION requests
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json()); // Parse JSON
app.use(cookieParser()); // Parse cookies, store them in req.cookies

app.use(authRouter);
app.use(usersRouter);

//app.use(handleErrors); // This runs if an exception is not handled earlier
console.log("SOCKET_AUT", SOCKET_AUT);

if(SOCKET_AUT)
  io.use(protectSocket);

// Set up the sockets
setupSocket(io);
