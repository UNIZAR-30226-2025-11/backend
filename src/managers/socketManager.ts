import { Socket } from "socket.io";

export class SocketManager {
    private static sockets: Map<string, Socket> = new Map();

    static addSocket(username: string, socket: Socket) {
        this.sockets.set(username, socket);
    }

    static removeSocket(username: string) {
        this.sockets.delete(username);
    }

    static getSocket(username: string): Socket | undefined {
        return this.sockets.get(username);
    }

    static hasSocket(username: string): boolean {
        return this.sockets.has(username);
    }

    static waitForPlayerResponse<TRequest, TResponse >(
        username: string, 
        socketEvent: string, 
        requestData: TRequest,
        timeOut: number
    ): Promise<TResponse | undefined> {
        const socket: Socket | undefined = this.getSocket(username);
        if (socket === undefined) {
            console.log("Socket not found");
            return Promise.reject(undefined);
        }
    
        console.log("Waiting for frontend response");
        return new Promise((resolve, reject) => {
            socket.emit(socketEvent, requestData);
    
            socket.once(socketEvent, (response: TResponse) => {
                resolve(response); // Resolve the promise with the expected response type
            });
    
            setTimeout(() => {
                reject(undefined); // Reject with undefined if timeout occurs
            }, timeOut);
        });
    }
    

}