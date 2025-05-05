
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
    BackendStartGameResponseJSON,
    BackendPlayerCanReconnectJSON,
    BackendGameSelectNopeJSON,
    FrontendGameSelectNopeResponseJSON,
    BackendGetMessagesJSON,
    MsgJSON,
    BackendNotifyActionJSON,
} from "../../api/socketAPI.js";
import { SocketManager } from "../../managers/socketManager.js";
import { CardType, Card } from "../../models/Card.js";
import { handleError } from "../../constants/constants.js";
import { ActionType } from "../../models/ActionType.js";
import { CardArray } from "../../models/CardArray.js";
import { Player } from "../../models/Player.js";
import logger from "../../config/logger.js";
import { Message } from "../../models/Message.js";
import { FrontendGameSelectCardResponseJSONSchema, FrontendGameSelectCardTypeResponseJSONSchema, FrontendGameSelectNopeResponseJSONSchema, FrontendGameSelectPlayerResponseJSONSchema } from "../../schemas/socketAPI.js";
import { TIMEOUT_RESPONSE } from "../../config.js";
import { PlayerHistory } from "../../models/PlayerHistory.js";

export class socketCommunicationGateway implements CommunicationGateway {

    lobbyId: string;
    playersUsernamesInLobby: string[];

    constructor(lobbyId: string){
        this.lobbyId = lobbyId;
        this.playersUsernamesInLobby = [];
    }

    registerPlayer(username: string): void {
        logger.debug(`Registering player ${username} in Gateway for lobby ${this.lobbyId}`);
        this.playersUsernamesInLobby.push(username);
    }

    broadcastNewMessages(messages: Message[]): void {

        const messagesJSON: MsgJSON[] = messages.map((msg) => (msg.toJSON()));
        const msg: BackendGetMessagesJSON = {
            error: false,
            errorMsg: "",
            messages: messagesJSON,
            lobbyId: this.lobbyId
        };

        this.broadcastMsg(msg, "get-messages")
    }

    private broadcastMsg<TMsg>(msg: TMsg, socketChannel: string): void {
        this.playersUsernamesInLobby.forEach((username) => {
            const socket: Socket|undefined = SocketManager.getSocket(username);
            if(socket == undefined)
            {
                logger.error(`Socket for user ${username} not found.`)
            } else {
                logger.debug(`Sending "${socketChannel}" message to ${username}: %j`, msg);
                socket.emit(socketChannel, msg);
            }
        });
    }

    async getACardType(username: string, lobbyId: string): Promise<CardType|undefined> {
        
        logger.info("Waiting for player response for card type");

        const petition: BackendGameSelectCardTypeJSON = {
            error: false,
            errorMsg: "",
            lobbyId: lobbyId,
            timeOut: TIMEOUT_RESPONSE
        };

        const response: FrontendGameSelectCardTypeResponseJSON | undefined = 
            await SocketManager.waitForPlayerResponse<
                BackendGameSelectCardTypeJSON, 
                FrontendGameSelectCardTypeResponseJSON
            >
        (
            username,
            "game-select-card-type", 
            petition,
            this.playersUsernamesInLobby,
            {
                error: false,
                errorMsg: "",
                triggerUser: username,
                targetUser: "",
                action: ActionType[ActionType.AskingCardType]
            },
            FrontendGameSelectCardTypeResponseJSONSchema,
            TIMEOUT_RESPONSE
        );

        if(response === undefined) {
            return undefined;
        }

        handleError(response.error, response.errorMsg);
        
        if(response.cardType === undefined) {
            return undefined;
        }
        
        return CardType[response.cardType as keyof typeof CardType];
    }

    async getAPlayerUsername(username: string, lobbyId: string): Promise<string|undefined> {
        
        logger.info("Waiting for player response for player ID");

        const petition: BackendGameSelectPlayerJSON = {
            error: false,
            errorMsg: "",
            lobbyId: lobbyId,
            timeOut: TIMEOUT_RESPONSE
        };
        
        const response: FrontendGameSelectPlayerResponseJSON | undefined = 
            await SocketManager.waitForPlayerResponse<
                BackendGameSelectPlayerJSON, 
                FrontendGameSelectPlayerResponseJSON
            >
        (
            username,
            "game-select-player", 
            petition,
            this.playersUsernamesInLobby,
            {
                error: false,
                errorMsg: "",
                triggerUser: username,
                targetUser: "",
                action: ActionType[ActionType.AskingPlayer]
            },
            FrontendGameSelectPlayerResponseJSONSchema,
            TIMEOUT_RESPONSE
        );

        if (response === undefined) {
            return undefined;
        }

        handleError(response.error, response.errorMsg);

        if(response.playerUsername === undefined) {
            return undefined;
        }

        return response.playerUsername;
    }

    async getACard(username: string, lobbyId: string): Promise<Card|undefined> {
        
        logger.info("Waiting for player response for card");
        const petition: BackendGameSelectCardJSON = {
            error: false,
            errorMsg: "",
            lobbyId: lobbyId,
            timeOut: TIMEOUT_RESPONSE
        };

        const response: FrontendGameSelectCardResponseJSON | undefined = 
            await SocketManager.waitForPlayerResponse<
                BackendGameSelectCardJSON, 
                FrontendGameSelectCardResponseJSON
            >
        (
            username,
            "game-select-card", 
            petition,
            this.playersUsernamesInLobby,
            {
                error: false,
                errorMsg: "",
                triggerUser: username,
                targetUser: "",
                action: ActionType[ActionType.AskingCard]
            },
            FrontendGameSelectCardResponseJSONSchema,
            TIMEOUT_RESPONSE
        );

        if(response === undefined) {
            return undefined;
        }

        handleError(response.error, response.errorMsg);

        if(response.card === undefined) {
            return undefined;
        }

        return Card.fromJSON(response.card);
    }

    async getNopeUsage(username: string, lobbyId: string): Promise<boolean|undefined> {
        
        logger.info("Waiting for player response for Nope usage");
        const petition: BackendGameSelectNopeJSON = {
            error: false,
            errorMsg: "",
            lobbyId: lobbyId,
            timeOut: TIMEOUT_RESPONSE
        };

        const response: FrontendGameSelectNopeResponseJSON | undefined =
            await SocketManager.waitForPlayerResponse<
                BackendGameSelectNopeJSON, 
                FrontendGameSelectNopeResponseJSON
            >
        (
            username,
            "game-select-nope", 
            petition,
            this.playersUsernamesInLobby,
            {
                error: false,
                errorMsg: "",
                triggerUser: username,
                targetUser: "",
                action: ActionType[ActionType.AskingNope]
            },
            FrontendGameSelectNopeResponseJSONSchema,
            TIMEOUT_RESPONSE
        );

        if(response === undefined) {
            return undefined;
        }

        handleError(response.error, response.errorMsg);

        if(response.useNope === undefined) {
            return undefined;
        }

        return response.useNope;
    }

    broadcastStartGame(): void {
        logger.info("Notifying all players to start the game");
        const response: BackendStartGameResponseJSON = 
        {
            error: false,
            errorMsg: ""
        };
        this.broadcastMsg<BackendStartGameResponseJSON>(response, "start-game");
    }

    broadcastWinnerNotification(winnerUsername: string, playersHistory: PlayerHistory[]): void {
        
        logger.info(`Notifying all players that player ${winnerUsername} won`);
        playersHistory.forEach((player) => {
            const msg: BackendWinnerJSON = {
                error: false,
                errorMsg: "",
                winnerUsername: winnerUsername,
                coinsEarned:player.coinsEarned,
                lobbyId: this.lobbyId,
                isWinner: player.isWinner,
                gameDate: player.gameDate,
                timePlayed: player.timePlayed,
                turnsPlayed: player.turnsPlayed,
            }

            const socket: Socket|undefined = SocketManager.getSocket(player.username);

            if(socket === undefined) {
                logger.error("Socket not found!");
                return;
            }
            logger.debug(`Sending "winner" message to ${player.username}: %j`, msg);
            socket.emit("winner", msg);
        });
    }

    broadcastPlayerDisconnect(playerUsername: string): void {

        logger.info(`Notifying all players that player ${playerUsername} disconnected`);
        const msg: BackendNotifyActionJSON = {
            error: false,
            errorMsg: "",
            triggerUser: playerUsername,
            targetUser: "",
            action: ActionType[ActionType.Disconnection],
        }
        
        this.broadcastMsg<BackendNotifyActionJSON>(msg, "notify-action");
    }

    broadcastPlayerReconnect(playerUsername: string): void {
            
        logger.info(`Notifying all players that player ${playerUsername} reconnected`);
        const msg: BackendNotifyActionJSON = {
            error: false,
            errorMsg: "",
            triggerUser: playerUsername,
            targetUser: "",
            action: ActionType[ActionType.Reconnection],
        }
        
        this.broadcastMsg<BackendNotifyActionJSON>(msg, "notify-action");
    }

    broadcastAction(action: ActionType, triggerUser: string, targetUser?: string): void {
        
        logger.info(`Notifying all players that player ${triggerUser} performed action ${action}`);
        
        const msg: BackendNotifyActionJSON = {
            error: false,
            errorMsg: "",
            triggerUser: triggerUser,
            targetUser: targetUser?targetUser:"",
            action: ActionType[action],
        }

        this.broadcastMsg<BackendNotifyActionJSON>(msg, "notify-action");
    }


    notifyPlayerCanReconnect(username: string): void {
        logger.info(`Notifying player ${username} that they can reconnect`);
        const msg: BackendPlayerCanReconnectJSON = {
            error: false,
            errorMsg: "",
            lobbyId: this.lobbyId,
        };
        const socket: Socket|undefined = SocketManager.getSocket(username);

        if(socket === undefined) {
            logger.error("Socket not found!");
            return;
        }

        logger.debug(`Sending "player-reconnect" message to ${username}: %j`, msg);
        socket.emit("player-reconnect", msg);
    }

    notifyOkPlayedCardWithCardObtained(card: Card, username: string): void {

        logger.info(`Notifying player ${username} that they drew a card`);
        const msg: BackendGamePlayedCardsResponseJSON = {
            error: false,
            errorMsg: "",
            cardsSeeFuture: [],
            cardReceived: card.toJSON()
        }
        const socket: Socket|undefined = SocketManager.getSocket(username);

        if(socket === undefined) {
            logger.error("Socket not found!");
            return;
        }

        logger.debug(`Sending "game-played-cards" message to ${username}: %j`, msg);
        socket.emit("game-played-cards", msg);
    }

    notifyFutureCards(cards: CardArray, username: string): void {

        logger.info(`Notifying player ${username} of the future cards`);
        const msg: BackendGamePlayedCardsResponseJSON = {
            error: false,
            errorMsg: "",
            cardsSeeFuture: cards.toJSON(),
            cardReceived: {id: -1, type: ""}
        }

        const socket: Socket|undefined = SocketManager.getSocket(username);

        if(socket === undefined) {
            logger.error("Socket not found!");
            return;
        }

        logger.debug(`Sending "game-played-cards" message to ${username}: %j`, msg);
        socket.emit("game-played-cards", msg);
    }

    notifyOkPlayedCards(username: string): void {
        logger.info(`Notifying player ${username} that the cards were played correctly`);
        const msg: BackendGamePlayedCardsResponseJSON = {
            error: false,
            errorMsg: "",
            cardsSeeFuture: [],
            cardReceived: {id: -1, type: ""}
        }

        const socket: Socket|undefined = SocketManager.getSocket(username);

        if(socket === undefined) {
            logger.error("Socket not found!");
            return;
        }

        logger.debug(`Sending "game-played-cards" message to ${username}: %j`, msg);
        socket.emit("game-played-cards", msg);
    }

    notifyMessages(username: string, messages: Message[]): void {
        logger.info(`Notifying player ${username} the messages of the lobby`);

        const messagesJSON: MsgJSON[] = messages.map((msg) => msg.toJSON());
        const msg: BackendGetMessagesJSON = {
            error: false,
            errorMsg: "",
            messages: messagesJSON,
            lobbyId: this.lobbyId
        };

        const socket: Socket|undefined = SocketManager.getSocket(username);

        if(socket === undefined) {
            logger.error("Socket not found!");
            return;
        }

        logger.debug(`Sending "get-messages" message to ${username}: %j`, msg);
        socket.emit("get-messages", msg);      
    }

    notifyGameState(
        players: Player[], 
        index: number,
        turnUsername: string, 
        timeOut: number, 
        cardsLeftInDeck: number,
        lastCardPlayed: Card | undefined,
        turnsLeft: number
    ): void {

        const username: string = players[index].username;
        const playerCards: CardArray = players[index].hand;

        logger.info(`Notifying player ${username} of the new state of the game`);
        const response: BackendStateUpdateJSON = {
            error: false,
            errorMsg: "",
            lobbyId: this.lobbyId,
            playerCards: playerCards.toJSON(),
            players: players.map(p => p.toJSONHidden()),
            turnUsername: turnUsername,
            timeOut: timeOut,
            playerUsername: username,
            cardsLeftInDeck: cardsLeftInDeck,
            lastCardPlayed: lastCardPlayed?lastCardPlayed.toJSON():undefined,
            turnsLeft: turnsLeft
        }

        const socket: Socket|undefined = SocketManager.getSocket(username);

        if(socket === undefined) {
            logger.error("Socket not found!");
            return;
        }

        logger.debug(`Sending "game-state" message to ${username}.`);
        socket.emit("game-state", response);
    }

}