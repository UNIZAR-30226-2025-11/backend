
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
            lobbyId: lobbyId
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

    async getAPlayerUsername(username: string, lobbyId: string): Promise<string|undefined> {
        
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
            username,
            "game-select-player", 
            petition,
            TIMEOUT_RESPONSE
        );

        if (response === undefined) {
            logger.warn("Response not received");
            return undefined;
        }

        handleError(response.error, response.errorMsg);

        if(response.playerUsername === undefined) {
            logger.warn("Player ID not received");
            return undefined;
        }

        return response.playerUsername;
    }

    async getACard(username: string, lobbyId: string): Promise<Card|undefined> {
        
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
            username,
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

    broadcastStartGame(): void {
        logger.info("Notifying all players to start the game");
        const response: BackendStartGameResponseJSON = 
        {
            error: false,
            errorMsg: ""
        };
        this.broadcastMsg<BackendStartGameResponseJSON>(response, "start-game");
    }

    broadcastBombDefusedAction(triggerUser: string): void {

        logger.info(`Notifying all players that the bomb was defused by ${triggerUser}`);
        const msg: BackendNotifyActionJSON = {
            error: false,
            errorMsg: "",
            triggerUser: triggerUser,
            targetUser: "",
            action: ActionType[ActionType.BombDefused]
        }
        this.broadcastMsg<BackendNotifyActionJSON>(msg, "notify-action");
    }

    broadcastDrawCardAction(triggerUser: string): void {

        logger.info(`Notifying all players that player ${triggerUser} drew a card`);
        const msg: BackendNotifyActionJSON = {
            error: false,
            errorMsg: "",
            triggerUser: triggerUser,
            targetUser: "",
            action: ActionType[ActionType.DrawCard]
        }
        this.broadcastMsg<BackendNotifyActionJSON>(msg, "notify-action");
    }

    broadcastPlayerLostAction(triggerUser: string): void {

        logger.info(`Notifying all players that player ${triggerUser} lost`);
        const msg: BackendNotifyActionJSON = {
            error: false,
            errorMsg: "",
            triggerUser: triggerUser,
            targetUser: "",
            action: ActionType[ActionType.BombExploded]
        }
        this.broadcastMsg<BackendNotifyActionJSON>(msg, "notify-action");
    }

    broadcastShuffleDeckAction(triggerUser: string): void {

        logger.info(`Notifying all players that the deck was shuffled by ${triggerUser}`);
        const msg: BackendNotifyActionJSON = {
            error: false,
            errorMsg: "",
            triggerUser: triggerUser,
            targetUser: "",
            action: ActionType[ActionType.ShuffleDeck]
        }
        this.broadcastMsg<BackendNotifyActionJSON>(msg, "notify-action");
    }

    broadcastSkipTurnAction(triggerUser: string): void {

        logger.info(`Notifying all players that player ${triggerUser} skipped their turn`);
        const msg: BackendNotifyActionJSON = {
            error: false,
            errorMsg: "",
            triggerUser: triggerUser,
            targetUser: "",
            action: ActionType[ActionType.SkipTurn]
        }
        this.broadcastMsg<BackendNotifyActionJSON>(msg, "notify-action");
    }

    broadcastFutureAction(triggerUser: string): void {

        logger.info(`Notifying all players that player ${triggerUser} saw the future`);
        const msg: BackendNotifyActionJSON = {
            error: false,
            errorMsg: "",
            triggerUser: triggerUser,
            targetUser: "",
            action: ActionType[ActionType.FutureSeen]
        }
        this.broadcastMsg<BackendNotifyActionJSON>(msg, "notify-action");
    }


    broadcastAttackAction(triggerUser: string, targetUser: string): void {
        
        logger.info(`Notifying all players that player ${triggerUser} attacked player ${targetUser}`);
        const msg: BackendNotifyActionJSON = {
            error: false,
            errorMsg: "",
            triggerUser: triggerUser,
            targetUser: targetUser,
            action: ActionType[ActionType.Attack]
        }
        this.broadcastMsg<BackendNotifyActionJSON>(msg, "notify-action");
    }

    broadcastStealFailedAction(triggerUser: string, targetUser: string): void {

        logger.info(`Notifying all players that player ${triggerUser} failed to steal from player ${targetUser}`);
        const msg: BackendNotifyActionJSON = {
            error: false,
            errorMsg: "",
            triggerUser: triggerUser,
            targetUser: targetUser,
            action: ActionType[ActionType.AttackFailed]
        }
        this.broadcastMsg<BackendNotifyActionJSON>(msg, "notify-action");
    }

    broadcastFavorAction(triggerUser: string, targetUser: string): void {
        logger.info(`Notifying all players that player ${triggerUser} favored player ${targetUser}`);
        const msg: BackendNotifyActionJSON = {
            error: false,
            errorMsg: "",
            triggerUser: triggerUser,
            targetUser: targetUser,
            action: ActionType[ActionType.FavorAttack]
        }
        this.broadcastMsg<BackendNotifyActionJSON>(msg, "notify-action");
    }

    broadcastWinnerNotification(winnerUsername: string, coinsEarned: number): void {
        
        logger.info(`Notifying all players that player ${winnerUsername} won`);
        this.playersUsernamesInLobby.forEach((username) => {
            const msg: BackendWinnerJSON = {
                error: false,
                errorMsg: "",
                winnerUsername: winnerUsername,
                coinsEarned:username==winnerUsername?coinsEarned:0,
                lobbyId: this.lobbyId
            }

            const socket: Socket|undefined = SocketManager.getSocket(username);

            if(socket === undefined) {
                logger.error("Socket not found!");
                return;
            }
            logger.debug(`Sending "winner" message to ${username}: %j`, msg);
            socket.emit("winner", msg);
        });
    }

    broadcastPlayerDisconnect(playerUsername: string): void {

        logger.info(`Notifying all players that player ${playerUsername} disconnected`);
        this.playersUsernamesInLobby.forEach((username) => {
            const msg: BackendPlayerDisconnectedJSON = {
                error: false,
                errorMsg: "",
                playerUsername: playerUsername
            }

            const socket: Socket|undefined = SocketManager.getSocket(username);

            if(socket === undefined) {
                logger.error("Socket not found!");
                return;
            }

            logger.debug(`Sending "player-disconnected" message to ${socket.data.user.username}: %j`, msg);
            socket.emit("player-disconnected", msg);
        });
    }

    notifyDrewCard(card: Card, username: string): void {

        logger.info(`Notifying player ${username} that they drew a card`);
        const msg: BackendGamePlayedCardsResponseJSON = {
            error: false,
            errorMsg: "",
            cardsSeeFuture: "",
            cardReceived: card.toString()
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
            cardsSeeFuture: cards.toString(),
            cardReceived: ""
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
            cardsSeeFuture: "",
            cardReceived: ""
        }

        const socket: Socket|undefined = SocketManager.getSocket(username);

        if(socket === undefined) {
            logger.error("Socket not found!");
            return;
        }

        logger.debug(`Sending "game-played-cards" message to ${username}: %j`, msg);
        socket.emit("game-played-cards", msg);
    }

    notifyGameState(
        players: Player[], 
        index: number,
        turnUsername: string, 
        timeOut: number, 
    ): void {

        const username: string = players[index].username;
        const playerCards: CardArray = players[index].hand;

        logger.info(`Notifying player ${username} of the new state of the game`);
        const response: BackendStateUpdateJSON = {
            error: false,
            errorMsg: "",
            playerCards: playerCards.toJSON(),
            players: players.map(p => p.toJSONHidden()),
            turnUsername: turnUsername,
            timeOut: timeOut,
            playerUsername: username
        }

        const socket: Socket|undefined = SocketManager.getSocket(username);

        if(socket === undefined) {
            logger.error("Socket not found!");
            return;
        }

        logger.debug(`Sending "game-state" message to ${username}: %j`, response);
        socket.emit("game-state", response);
    }

}