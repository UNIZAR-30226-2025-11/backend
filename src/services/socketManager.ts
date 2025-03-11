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

    static waitForPlayerResponse(socketId: string, responseEvent: any, requestEvent: any, requestData: any, timeOut: number): Promise<any> {
        const socket:Socket|undefined = this.getSocket(socketId);
        if (socket === undefined) {
            console.log("Socket not found");
            return Promise.reject({error:true,errorMsg:"Socket not found"});
        }

        console.log("Waiting for player response");
        return new Promise((resolve, reject) => {
            socket.emit(requestEvent, requestData);
    
            socket.once(responseEvent, (response: any) => {
                resolve(response); // Resolve the promise when response is received
            });
    
            setTimeout(() => {
                reject({error:true, errorMsg:"No response from player"}); // Timeout in case the player does not respond
            }, timeOut); // Wait for the player to respond
        });
    }

}