import { createServer } from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { authRouter } from "./auth/routes.js";
import { usersRouter } from "./users/routes.js";
import { setupSocket } from "./socketSetup.js";

export const app = express();
export const server = createServer(app);
const io = new Server(server, {
    cors: { origin: "*" } // Allow React frontend
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

app.use(cors()); // Allow Cross-Origin requests by parsing OPTION requests
app.use(express.json()); // Parse JSON
app.use(cookieParser()); // Parse cookies, store them in req.cookies

app.use(authRouter);
app.use(usersRouter);

//app.use(handleErrors); // This runs if an exception is not handled earlier

// Set up the sockets
setupSocket(io);