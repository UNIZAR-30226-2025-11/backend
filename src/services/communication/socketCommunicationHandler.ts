// src/services/socketCommunicationHandler.ts
import { Socket } from "socket.io";
import { CommunicationHandler } from "./communicationHandler.js";
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
    BackendNotifyActionJSON
} from "../../api/socketAPI.js";
import { SocketManager } from "../socketManager.js";
import { TIMEOUT_RESPONSE } from "../../constants/constants.js";
import { CardType, Card } from "../../models/Card.js";
import { handleError } from "../../constants/constants.js";
import { ActionType } from "../../models/ActionType.js";
import { CardArray } from "../../models/CardArray.js";
import { Player } from "../../models/Player.js";

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

    async getACardType(playerId: number, lobbyId: string): Promise<CardType|undefined> {
        
        const petition: BackendGameSelectCardTypeJSON = {
            error: false,
            errorMsg: "",
            lobbyId: lobbyId
        };

        
        const response: FrontendGameSelectCardTypeResponseJSON | undefined = 
            await SocketManager.waitForPlayerResponse<
                BackendGameSelectCardTypeJSON, 
                FrontendGameSelectCardTypeResponseJSON
            >
        (
            this.sockets.get(playerId)!.id,
            "game-select-card-type", 
            petition,
            TIMEOUT_RESPONSE
        );

        if(response === undefined) {
            console.log("Response not received");
            return undefined;
        }

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
        
        const response: FrontendGameSelectPlayerResponseJSON | undefined = 
            await SocketManager.waitForPlayerResponse<
                BackendGameSelectPlayerJSON, 
                FrontendGameSelectPlayerResponseJSON
            >
        (
            this.sockets.get(playerId)!.id,
            "game-select-player", 
            petition,
            TIMEOUT_RESPONSE
        );

        if (response === undefined) {
            console.log("Response not received");
            return undefined;
        }

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

        
        const response: FrontendGameSelectCardResponseJSON | undefined = 
            await SocketManager.waitForPlayerResponse<
                BackendGameSelectCardJSON, 
                FrontendGameSelectCardResponseJSON
            >
        (
            this.sockets.get(playerId)!.id,
            "game-select-card", 
            petition,
            TIMEOUT_RESPONSE
        );

        if(response === undefined) {
            console.log("Response not received");
            return undefined;
        }

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

    notifyBombDefusedAction(creatorId: number): void {
        const msg: BackendNotifyActionJSON = {
            error: false,
            errorMsg: "",
            creatorId: creatorId,
            actionedPlayerId: -1,

            action: ActionType.BombDefused
        }
        this.sockets.forEach((socket) => {
            socket.emit("notify-action", msg);
        });
    }

    notifyPlayerLostAction(playerId: number): void {
        const msg: BackendNotifyActionJSON = {
            error: false,
            errorMsg: "",
            creatorId: -1,
            actionedPlayerId: playerId,
            action: ActionType.BombExploded
        }
        this.sockets.forEach((socket) => {
            socket.emit("notify-action", msg);
        });
    }

    notifyDrewCard(card: Card, playerId: number): void {
        const msg: BackendGamePlayedCardsResponseJSON = {
            error: false,
            errorMsg: "",
            cardsSeeFuture: "",
            cardReceived: card.toString()
        }
        this.sockets.get(playerId)!.emit("game-played-cards", msg);
    }

    notifyDrawCardAction(playerId: number): void {
        const msg: BackendNotifyActionJSON = {
            error: false,
            errorMsg: "",
            creatorId: -1,
            actionedPlayerId: playerId,
            action: ActionType.DrawCard
        }
        this.sockets.forEach((socket) => {
            socket.emit("notify-action", msg);
        });
    }

    notifyErrorPlayedCards(msg: string, playerId: number): void {
        const response: BackendGamePlayedCardsResponseJSON = {
            error: true,
            errorMsg: msg,
            cardsSeeFuture: "",
            cardReceived: ""
        }
        this.sockets.get(playerId)!.emit("game-played-cards", response);
    }


    notifyShuffleDeckAction(creatorId: number): void {
        const msg: BackendNotifyActionJSON = {
            error: false,
            errorMsg: "",
            creatorId: creatorId,
            actionedPlayerId: -1,
            action: ActionType.ShuffleDeck
        }
        this.sockets.forEach((socket) => {
            socket.emit("notify-action", msg);
        });
    }

    notifySkipTurnAction(creatorId: number): void {
        const msg: BackendNotifyActionJSON = {
            error: false,
            errorMsg: "",
            creatorId: creatorId,
            actionedPlayerId: -1,
            action: ActionType.SkipTurn
        }
        this.sockets.forEach((socket) => {
            socket.emit("notify-action", msg);
        });
    }

    notifyFutureAction(creatorId: number): void {
        const msg: BackendNotifyActionJSON = {
            error: false,
            errorMsg: "",
            creatorId: creatorId,
            actionedPlayerId: -1,
            action: ActionType.FutureSeen
        }
        this.sockets.forEach((socket) => {
            socket.emit("notify-action", msg);
        });
    }

    notifyFutureCards(cards: CardArray, playerId: number): void {
        const msg: BackendGamePlayedCardsResponseJSON = {
            error: false,
            errorMsg: "",
            cardsSeeFuture: cards.toString(),
            cardReceived: ""
        }
        this.sockets.get(playerId)!.emit("game-played-cards", msg);
    }

    notifyAttackAction(creatorId: number, targetId: number): void {
        const msg: BackendNotifyActionJSON = {
            error: false,
            errorMsg: "",
            creatorId: creatorId,
            actionedPlayerId: targetId,
            action: ActionType.Attack
        }
        this.sockets.forEach((socket) => {
            socket.emit("notify-action", msg);
        });
    }

    notifyStealFailedAction(creatorId: number, targetId: number): void {
        const msg: BackendNotifyActionJSON = {
            error: false,
            errorMsg: "",
            creatorId: creatorId,
            actionedPlayerId: targetId,
            action: ActionType.AttackFailed
        }
        this.sockets.forEach((socket) => {
            socket.emit("notify-action", msg);
        });
    }

    notiftyWinner(winnerId: number, coinsEarned: number): void {
        const msg: BackendWinnerJSON = {
            error: false,
            errorMsg: "",
            userId: winnerId,
            coinsEarned: coinsEarned
        }
        this.sockets.get(winnerId)!.emit("winner", msg);
    }

    notifyOkPlayedCards(playerId: number): void {
        const msg: BackendGamePlayedCardsResponseJSON = {
            error: false,
            errorMsg: "",
            cardsSeeFuture: "",
            cardReceived: ""
        }
        this.sockets.get(playerId)!.emit("game-played-cards", msg);
    }

    notifyFavorAction(creatorId: number, targetId: number): void {
        const msg: BackendNotifyActionJSON = {
            error: false,
            errorMsg: "",
            creatorId: creatorId,
            actionedPlayerId: targetId,
            action: ActionType.FavorAttack
        }
        this.sockets.forEach((socket) => {
            socket.emit("notify-action", msg);
        });
    }

    notifyWinner(winnerId: number, coinsEarned: number): void {
        const msg: BackendWinnerJSON = {
            error: false,
            errorMsg: "",
            userId: winnerId,
            coinsEarned: coinsEarned
        }
        this.sockets.get(winnerId)!.emit("winner", msg);
    }

    notifyGameState(
        playedCards: CardArray, 
        players: Player[], 
        turn: number, timeOut: number, 
        playerId: number
    ): void {
        const response: BackendStateUpdateJSON = {
            error: false,
            errorMsg: "",
            playerCards: playedCards.toJSON(),
            players: players.map(p => p.toJSONHidden()),
            turn: turn,
            timeOut: timeOut,
            playerId: playerId
        }

        this.sockets.get(playerId)!.emit("game-state", response);
    }
}