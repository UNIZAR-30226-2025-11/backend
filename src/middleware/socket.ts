import * as cookie from 'cookie';
import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
import { JWT_SECRET } from '../config.js';


export const protectSocket = (socket: Socket, next: (err?: Error) => void) => {
    try {
        // Access the raw cookie string from the handshake headers
        const cookieString = socket.handshake.headers.cookie;

        if (!cookieString) {
            socket.disconnect(true);
            return next(new Error("No cookies provided!"));
        }

        // Parse the cookie string
        const cookies = cookie.parse(cookieString);

        // Extract the access_token from the parsed cookies
        const accessToken = cookies.access_token;

        if (!accessToken) {
            socket.disconnect(true);
            return next(new Error("No access token provided!"));
        }

        // Verify the JWT token
        const decoded = jwt.verify(accessToken, JWT_SECRET) as {
            username: string;
            id: string;
            games_played: number;
            games_won: number;
            coins: number;
        };

        // Attach the decoded user information to the socket object for later use
        socket.data.user = decoded;

        // Proceed to the next middleware or handler
        next();
    } catch (err) {
        if (err instanceof Error) {
            console.log("Authentication error:", err.message);
        } else {
            console.log("Authentication error:", err);
        }
        next(new Error("Authentication failed!"));
    }
};