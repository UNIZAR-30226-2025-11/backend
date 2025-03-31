import { Socket } from "socket.io";
import logger from "../config/logger.js";
import { BackendNotifyActionJSON } from "../api/socketAPI.js";

export class SocketManager {

    /** Map of usernames to sockets  */
    private static sockets: Map<string, Socket> = new Map();
    
    /**
     * Add a socket to the manager
     * @param username The username of the socket to be added
     * @param socket The socket to be added
     * @returns
     */
    static addSocket(username: string, socket: Socket) {
        logger.debug(`Adding socket ${socket.id} to ${username}`);
        this.sockets.set(username, socket);
    }

    /**
     * Remove a socket from the manager
     * @param username The username of the socket to be removed
     * @returns
     */
    static removeSocket(username: string) {
        logger.debug(`Removing socket from ${username}`);
        this.sockets.delete(username);
    }

    /**
     * Get a socket from the manager
     * @param username The username of the socket to be retrieved
     * @returns The socket if it exists, undefined otherwise
     */
    static getSocket(username: string): Socket | undefined {
        return this.sockets.get(username);
    }

    /**
     * Check if a username has a socket
     * @param username The username to be checked
     * @returns True if the username has a socket, false otherwise
     */
    static hasSocket(username: string): boolean {
        return this.sockets.has(username);
    }
    
    static broadCastEvent<TMsg>(event: string, msg: TMsg, usernames: string[]) {
        logger.debug(`Broadcasting in event ${event} message %j`, msg);
        usernames.forEach((username) => {
            logger.debug(`Sending message to ${username}.`);
            const socket: Socket | undefined = this.getSocket(username);
            if (socket) {
                socket.emit(event, msg);
            } else {
                logger.error(`Socket not found for ${username}`);
            }
        });
    }

    /**
     * This function sends a request to the player and waits for a response via
     * the socket event. If the player does not respond within the timeOut, the
     * promise is rejected with undefined.
     * @param username The username of the player to wait for
     * @param socketEvent The event to wait for
     * @param requestData The data to send to the player
     * @param timeOut The time to wait for the player response
     * @returns The response from the player
     */
    static waitForPlayerResponse<TRequest, TResponse>(
        username: string, 
        socketEvent: string, 
        requestData: TRequest,
        usernames: string[],
        actionData: BackendNotifyActionJSON,
        timeOut: number
    ): Promise<TResponse | undefined> {

        const socket: Socket | undefined = this.getSocket(username);
        if (socket === undefined) {
            logger.error(`Socket not found for ${username}`);
            return Promise.resolve(undefined);
        }
        
        this.broadCastEvent<BackendNotifyActionJSON>(
            "notify-action",
            actionData,
            usernames
        );

        return new Promise((resolve) => {
            logger.debug(`Sending request to ${username} on event ${socketEvent}:\t%j`, requestData);
            socket.emit(socketEvent, requestData);
            
            logger.debug(`AWAIT: Waiting for response from ${username} on event ${socketEvent}`);
    
            const timeout = setTimeout(() => {
                logger.warn(`DONE: Timeout waiting for response from ${username} on event ${socketEvent}`);
                resolve(undefined);
            }, timeOut);
    
            socket.once(socketEvent, (response: TResponse) => {
                clearTimeout(timeout);
                logger.debug(`DONE: Response received from ${username} on event ${socketEvent}:\t%j`, response);
                resolve(response);
            });
        });
    }
    

}