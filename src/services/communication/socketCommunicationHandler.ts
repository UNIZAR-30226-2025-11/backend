// src/services/socketCommunicationHandler.ts
import { Socket } from "socket.io";
import { CommunicationHandler } from "./communicationHandler";
import { 
    BackendStateUpdateJSON, 
    BackendWinnerJSON, 
    FrontendGameSelectCardTypeResponseJSON,
    FrontendGameSelectPlayerResponseJSON,
    FrontendGameSelectCardResponseJSON,
    BackendGamePlayedCardsResponseJSON,
    BackendGameSelectCardTypeJSON,
    BackendGameSelectPlayerJSON,
    BackendGameSelectCardJSON,
    
} from "../../api/responses";
import { SocketManager } from "../socketManager";
import { TIMEOUT_RESPONSE } from "../../constants/constants";
import { CardType, Card } from "../../models/Card";
import { handleError } from "../../constants/constants";

export class SocketCommunicationHandler implements CommunicationHandler {
    private sockets: Map<number, Socket>; // Map player IDs to their sockets

    constructor() {
        this.sockets = new Map();
    }

    toJSON(): {comm:number} {
        return{comm: 1}
    }

    registerPlayer(playerId: number, socket: Socket): void {
        this.sockets.set(playerId, socket);
    }

    sendGameJSON(gameJSON: BackendStateUpdateJSON, playerID: number): void {
        const socket: Socket | undefined = this.sockets.get(playerID);
        if (socket !== undefined) {
            socket.emit("game-state", gameJSON);
        }
    }

    notifyWinner(winnerJSON: BackendWinnerJSON): void {
        this.sockets.forEach((socket) => {
            socket.emit("winner", winnerJSON);
        });
    }

    async getACardType(playerId: number, lobbyId: string): Promise<CardType|undefined> {
        
        const petition: BackendGameSelectCardTypeJSON = {
            error: false,
            errorMsg: "",
            lobbyId: lobbyId
        };

        
        const response: FrontendGameSelectCardTypeResponseJSON = await SocketManager.waitForPlayerResponse
        (
            this.sockets.get(playerId)!.id,
            "game-select-card-type", 
            "game-select-card-type", 
            petition,
            TIMEOUT_RESPONSE
        );

        handleError(response.error, response.errorMsg);
        
        if(response.cardType === undefined) {
            console.log("Card type not received");
            return undefined;
        }
        
        return CardType[response.cardType as keyof typeof CardType];
    }

    async getAPlayerId(playerId: number, lobbyId: string): Promise<number|undefined> {
        
        const petition: BackendGameSelectPlayerJSON = {
            error: false,
            errorMsg: "",
            lobbyId: lobbyId
        };
        
        const response: FrontendGameSelectPlayerResponseJSON = await SocketManager.waitForPlayerResponse
        (
            this.sockets.get(playerId)!.id,
            "game-select-player", 
            "game-select-player", 
            petition,
            TIMEOUT_RESPONSE
        );

        console.log(response);

        handleError(response.error, response.errorMsg);

        if(response.userId === undefined) {
            console.log("Player ID not received");
            return undefined;
        }

        return response.userId;
    }

    async getACard(playerId: number, lobbyId: string): Promise<Card|undefined> {
        
        const petition: BackendGameSelectCardJSON = {
            error: false,
            errorMsg: "",
            lobbyId: lobbyId
        };

        
        const response: FrontendGameSelectCardResponseJSON = await SocketManager.waitForPlayerResponse
        (
            this.sockets.get(playerId)!.id,
            "game-select-card", 
            "game-select-card", 
            petition,
            TIMEOUT_RESPONSE
        );

        handleError(response.error, response.errorMsg);

        if(response.card === undefined) {
            console.log("Card not received");
            return undefined;
        }

        return new Card(CardType[response.card as keyof typeof CardType]);
    }


    sendGamePlayedCardsResponseJSON(gamePlayedCardsJSON: BackendGamePlayedCardsResponseJSON, playerId: number): void
    {
        const socket: Socket | undefined = this.sockets.get(playerId);
        if (socket !== undefined) {
            socket.emit("game-played-cards", gamePlayedCardsJSON);
        }
    }
}