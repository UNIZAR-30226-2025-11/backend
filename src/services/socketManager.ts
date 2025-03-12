import { Socket } from "socket.io";

export class SocketManager {
    private static sockets: Map<string, Socket> = new Map();

    static addSocket(socket_id: string, socket: Socket) {
        this.sockets.set(socket_id, socket);
    }

    static removeSocket(socket_id: string) {
        this.sockets.delete(socket_id);
    }

    static getSocket(socket_id: string): Socket | undefined {
        return this.sockets.get(socket_id);
    }

    static waitForPlayerResponse<TRequest, TResponse >(
        socketId: string, 
        socketEvent: string, 
        requestData: TRequest,
        timeOut: number
    ): Promise<TResponse | undefined> {
        const socket: Socket | undefined = this.getSocket(socketId);
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