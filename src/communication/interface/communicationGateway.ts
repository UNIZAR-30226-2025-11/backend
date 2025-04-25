import { CardType, Card } from "../../models/Card.js";
import { Player } from "../../models/Player.js";
import { CardArray } from "../../models/CardArray.js";
import { Message } from "../../models/Message.js";
import { ActionType } from "../../models/ActionType.js";
import { PlayerHistory } from "../../models/PlayerHistory.js";

export interface CommunicationGateway {

    // Broadcast methods to notify all players
    broadcastStartGame(): void;
    broadcastNewMessages(messages: Message[]): void;
    broadcastAction(action: ActionType, triggerUser: string, targetUser?: string): void;
    broadcastWinnerNotification(winnerUsername: string, playersHistory: PlayerHistory[], coinsEarned: number): void;
    broadcastPlayerDisconnect(playerUsername: string): void;
    broadcastPlayerReconnect(playerUsername: string): void;

    // Individual methods to notify a player
    notifyGameState(
        players: Player[], 
        index:number, 
        turnUsername: string, 
        timeOut: number, 
        cardsLeftInDeck: number,
        lastCardPlayed: Card | undefined,
        turnsLeft: number
    ): void;

    notifyPlayerCanReconnect(username: string): void;
    notifyOkPlayedCardWithCardObtained(card: Card, username: string): void;
    notifyFutureCards(cards: CardArray, username: string): void;
    notifyOkPlayedCards(username: string): void;
    notifyMessages(username: string, messages: Message[]): void;
    
    // Get methods to request information from the frontend
    getACardType(username: string, lobbyId: string): Promise<CardType|undefined>;
    getAPlayerUsername(username: string, lobbyId: string): Promise<string|undefined>;
    getACard(username: string, lobbyId: string): Promise<Card|undefined>;
    getNopeUsage(username: string, lobbyId: string): Promise<boolean|undefined>;
}