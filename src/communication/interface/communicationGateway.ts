import { CardType, Card } from "../../models/Card.js";
import { Player } from "../../models/Player.js";
import { CardArray } from "../../models/CardArray.js";

export interface CommunicationGateway {

    // Broadcast methods to notify all players
    broadcastStartGame(): void;
    broadcastBombDefusedAction(triggerUser: string): void;
    broadcastPlayerLostAction(triggerUser: string): void;
    broadcastDrawCardAction(triggerUser: string): void;
    broadcastShuffleDeckAction(triggerUser: string): void;
    broadcastSkipTurnAction(triggerUser: string, targetUser: string): void;
    broadcastFutureAction(triggerUser: string): void;
    broadcastAttackAction(triggerUser: string, targetUser: string): void;
    broadcastStealFailedAction(triggerUser: string, targetUser: string): void;
    broadcastFavorAction(triggerUser: string, targetUser: string): void;
    broadcastNopeAction(triggerUser: string, targetUser: string): void;
    broadcastWildCardAction(triggerUser: string, targetUser: string, cardsNumber: number): void;
    broadcastWinnerNotification(winnerUsername: string, coinsEarned: number): void;
    broadcastPlayerDisconnect(playerUsername: string): void;
    broadcastPlayerReconnect(playerUsername: string): void;

    // Individual methods to notify a player
    notifyGameState(players: Player[], index:number, turnUsername: string, timeOut: number): void;
    notifyDrewCard(card: Card, username: string): void;
    notifyFutureCards(cards: CardArray, username: string): void;
    notifyOkPlayedCards(username: string): void;
    
    // Get methods to request information from the frontend
    getACardType(username: string, lobbyId: string): Promise<CardType|undefined>;
    getAPlayerUsername(username: string, lobbyId: string): Promise<string|undefined>;
    getACard(username: string, lobbyId: string): Promise<Card|undefined>;
    getNopeUsage(username: string, lobbyId: string): Promise<boolean|undefined>;
}