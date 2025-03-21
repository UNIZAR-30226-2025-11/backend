
import { Socket } from "socket.io";
import { CommunicationGateway } from "../interface/communicationGateway.js";
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
    BackendNotifyActionJSON,
    BackendStartGameResponseJSON,
    BackendPlayerDisconnectedJSON
} from "../../api/socketAPI.js";
import { SocketManager } from "../../managers/socketManager.js";
import { TIMEOUT_RESPONSE } from "../../constants/constants.js";
import { CardType, Card } from "../../models/Card.js";
import { handleError } from "../../constants/constants.js";
import { ActionType } from "../../models/ActionType.js";
import { CardArray } from "../../models/CardArray.js";
import { Player } from "../../models/Player.js";
import logger from "../../config/logger.js";

export class socketCommunicationGateway implements CommunicationGateway {
    private sockets: Map<number, Socket>; // Map player IDs to their sockets

    constructor() {
        this.sockets = new Map();
    }

    registerPlayer(playerId: number, socket: Socket): void {
        logger.debug(`Registering player ${playerId} with player ${socket.data.user.username}`);
        this.sockets.set(playerId, socket);
    }

    broadcastStartGame(): void {
        logger.info("Notifying all players to start the game");
        const response: BackendStartGameResponseJSON = 
        {
            error: false,
            errorMsg: ""
        };
        this.sockets.forEach((socket) => {
            logger.debug(`Sending "start-game" message to ${socket.data.user.username}: %j`, response);
            socket.emit("start-game", response);
        });
    }

    async getACardType(playerId: number, lobbyId: string): Promise<CardType|undefined> {
        
        logger.info("Waiting for player response for card type");

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
            logger.warn("Response not received");
            return undefined;
        }

        handleError(response.error, response.errorMsg);
        
        if(response.cardType === undefined) {
            logger.warn("Card type not received");
            return undefined;
        }
        
        return CardType[response.cardType as keyof typeof CardType];
    }

    async getAPlayerId(playerId: number, lobbyId: string): Promise<number|undefined> {
        
        logger.info("Waiting for player response for player ID");

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
            logger.warn("Response not received");
            return undefined;
        }

        handleError(response.error, response.errorMsg);

        if(response.userId === undefined) {
            logger.warn("Player ID not received");
            return undefined;
        }

        return response.userId;
    }

    async getACard(playerId: number, lobbyId: string): Promise<Card|undefined> {
        
        logger.info("Waiting for player response for card");
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
            logger.warn("Response not received");
            return undefined;
        }

        handleError(response.error, response.errorMsg);

        if(response.card === undefined) {
            logger.warn("Card not received");
            return undefined;
        }

        return new Card(CardType[response.card as keyof typeof CardType]);
    }

    broadcastBombDefusedAction(creatorId: number): void {

        logger.info(`Notifying all players that the bomb was defused by ${creatorId}`);
        const msg: BackendNotifyActionJSON = {
            error: false,
            errorMsg: "",
            creatorId: creatorId,
            actionedPlayerId: -1,
            action: ActionType[ActionType.BombDefused]
        }
        this.sockets.forEach((socket) => {
            logger.debug(`Sending "notify-action" message to ${socket.data.user.username}: %j`, msg);
            socket.emit("notify-action", msg);
        });
    }

    broadcastPlayerLostAction(playerId: number): void {

        logger.info(`Notifying all players that player ${playerId} lost`);
        const msg: BackendNotifyActionJSON = {
            error: false,
            errorMsg: "",
            creatorId: playerId,
            actionedPlayerId: -1,
            action: ActionType[ActionType.BombExploded]
        }
        this.sockets.forEach((socket) => {
            logger.debug(`Sending "notify-action" message to ${socket.data.user.username}: %j`, msg);
            socket.emit("notify-action", msg);
        });
    }

    notifyDrewCard(card: Card, playerId: number): void {

        logger.info(`Notifying player ${playerId} that they drew a card`);
        const msg: BackendGamePlayedCardsResponseJSON = {
            error: false,
            errorMsg: "",
            cardsSeeFuture: "",
            cardReceived: card.toString()
        }
        const socket: Socket|undefined = this.sockets.get(playerId);

        if(socket === undefined) {
            logger.error("Socket not found!");
            return;
        }

        logger.debug(`Sending "game-played-cards" message to ${socket.data.user.username}: %j`, msg);
        socket.emit("game-played-cards", msg);
    }

    broadcastDrawCardAction(playerId: number): void {

        logger.info(`Notifying all players that player ${playerId} drew a card`);
        const msg: BackendNotifyActionJSON = {
            error: false,
            errorMsg: "",
            creatorId: -1,
            actionedPlayerId: playerId,
            action: ActionType[ActionType.DrawCard]
        }

        this.sockets.forEach((socket) => {
            logger.debug(`Sending "notify-action" message to ${socket.data.user.username}: %j`, msg);
            socket.emit("notify-action", msg);
        });
    }

    notifyErrorPlayedCards(msg: string, playerId: number): void {
        logger.error(`Notifying player ${playerId} that an error occurred: ${msg}`);
        const response: BackendGamePlayedCardsResponseJSON = {
            error: true,
            errorMsg: msg,
            cardsSeeFuture: "",
            cardReceived: ""
        }

        const socket: Socket|undefined = this.sockets.get(playerId);

        if(socket === undefined) {
            logger.error("Socket not found!");
            return;
        }

        logger.debug(`Sending "game-played-cards" message to ${socket.data.user.username}: %j`, response);
        socket.emit("game-played-cards", response);
    }


    broadcastShuffleDeckAction(creatorId: number): void {

        logger.info(`Notifying all players that the deck was shuffled by ${creatorId}`);
        const msg: BackendNotifyActionJSON = {
            error: false,
            errorMsg: "",
            creatorId: creatorId,
            actionedPlayerId: -1,
            action: ActionType[ActionType.ShuffleDeck]
        }
        this.sockets.forEach((socket) => {
            logger.debug(`Sending "notify-action" message to ${socket.data.user.username}: %j`, msg);
            socket.emit("notify-action", msg);
        });
    }

    broadcastSkipTurnAction(creatorId: number): void {

        logger.info(`Notifying all players that player ${creatorId} skipped their turn`);
        const msg: BackendNotifyActionJSON = {
            error: false,
            errorMsg: "",
            creatorId: creatorId,
            actionedPlayerId: -1,
            action: ActionType[ActionType.SkipTurn]
        }
        this.sockets.forEach((socket) => {
            logger.debug(`Sending "notify-action" message to ${socket.data.user.username}: %j`, msg);
            socket.emit("notify-action", msg);
        });
    }

    broadcastFutureAction(creatorId: number): void {

        logger.info(`Notifying all players that player ${creatorId} saw the future`);
        const msg: BackendNotifyActionJSON = {
            error: false,
            errorMsg: "",
            creatorId: creatorId,
            actionedPlayerId: -1,
            action: ActionType[ActionType.FutureSeen]
        }
        this.sockets.forEach((socket) => {
            logger.debug(`Sending "notify-action" message to ${socket.data.user.username}: %j`, msg);
            socket.emit("notify-action", msg);
        });
    }

    notifyFutureCards(cards: CardArray, playerId: number): void {

        logger.info(`Notifying player ${playerId} of the future cards`);
        const msg: BackendGamePlayedCardsResponseJSON = {
            error: false,
            errorMsg: "",
            cardsSeeFuture: cards.toString(),
            cardReceived: ""
        }

        const socket: Socket|undefined = this.sockets.get(playerId);

        if(socket === undefined) {
            logger.error("Socket not found!");
            return;
        }

        logger.debug(`Sending "game-played-cards" message to ${socket.data.user.username}: %j`, msg);
        socket.emit("game-played-cards", msg);
        
    }

    broadcastAttackAction(creatorId: number, targetId: number): void {
        
        logger.info(`Notifying all players that player ${creatorId} attacked player ${targetId}`);
        const msg: BackendNotifyActionJSON = {
            error: false,
            errorMsg: "",
            creatorId: creatorId,
            actionedPlayerId: targetId,
            action: ActionType[ActionType.Attack]
        }
        this.sockets.forEach((socket) => {
            logger.debug(`Sending "notify-action" message to ${socket.data.user.username}: %j`, msg);
            socket.emit("notify-action", msg);
        });
    }

    broadcastStealFailedAction(creatorId: number, targetId: number): void {

        logger.info(`Notifying all players that player ${creatorId} failed to steal from player ${targetId}`);
        const msg: BackendNotifyActionJSON = {
            error: false,
            errorMsg: "",
            creatorId: creatorId,
            actionedPlayerId: targetId,
            action: ActionType[ActionType.AttackFailed]
        }
        this.sockets.forEach((socket) => {
            logger.debug(`Sending "notify-action" message to ${socket.data.user.username}: %j`, msg);
            socket.emit("notify-action", msg);
        });
    }

    broadcastWinnerNotification(winnerId: number, coinsEarned: number, lobbyId: string): void {
        
        logger.info(`Notifying all players that player ${winnerId} won`);
        this.sockets.forEach((socket, index) => {
            const msg: BackendWinnerJSON = {
                error: false,
                errorMsg: "",
                userId: winnerId,
                coinsEarned:index==winnerId?coinsEarned:0,
                lobbyId: lobbyId
            }
            logger.debug(`Sending "winner" message to ${socket.data.user.username}: %j`, msg);
            socket.emit("winner", msg);
        });
    }

    notifyOkPlayedCards(playerId: number): void {
        logger.info(`Notifying player ${playerId} that the cards were played correctly`);
        const msg: BackendGamePlayedCardsResponseJSON = {
            error: false,
            errorMsg: "",
            cardsSeeFuture: "",
            cardReceived: ""
        }

        const socket: Socket|undefined = this.sockets.get(playerId);

        if(socket === undefined) {
            logger.error("Socket not found!");
            return;
        }

        logger.debug(`Sending "game-played-cards" message to ${socket.data.user.username}: %j`, msg);
        socket.emit("game-played-cards", msg);
    }

    broadcastFavorAction(creatorId: number, targetId: number): void {
        logger.info(`Notifying all players that player ${creatorId} favored player ${targetId}`);
        const msg: BackendNotifyActionJSON = {
            error: false,
            errorMsg: "",
            creatorId: creatorId,
            actionedPlayerId: targetId,
            action: ActionType[ActionType.FavorAttack]
        }
        this.sockets.forEach((socket) => {
            logger.debug(`Sending "notify-action" message to ${socket.data.user.username}: %j`, msg);
            socket.emit("notify-action", msg);
        });
    }

    notifyGameState(
        playedCards: CardArray, 
        players: Player[], 
        turn: number, timeOut: number, 
        playerId: number
    ): void {

        logger.info(`Notifying player ${playerId} of the game`);
        const response: BackendStateUpdateJSON = {
            error: false,
            errorMsg: "",
            playerCards: playedCards.toJSON(),
            players: players.map(p => p.toJSONHidden()),
            turn: turn,
            timeOut: timeOut,
            playerId: playerId
        }

        const socket: Socket|undefined = this.sockets.get(playerId);

        if(socket === undefined) {
            logger.error("Socket not found!");
            return;
        }

        logger.debug(`Sending "game-state" message to ${socket.data.user.username}: %j`, response);
        socket.emit("game-state", response);
    }

    broadcastPlayerDisconnect(playerId: number): void {

        logger.info(`Notifying all players that player ${playerId} disconnected`);
        this.sockets.forEach((socket) => {
            const msg: BackendPlayerDisconnectedJSON = {
                error: false,
                errorMsg: "",
                playerId: playerId
            }
            logger.debug(`Sending "player-disconnected" message to ${socket.data.user.username}: %j`, msg);
            socket.emit("player-disconnected", msg);
        });
    }
}