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
    broadcastSkipTurnAction(triggerUser: string): void;
    broadcastFutureAction(triggerUser: string): void;
    broadcastAttackAction(triggerUser: string, targetUser: string): void;
    broadcastStealFailedAction(triggerUser: string, targetUser: string): void;
    broadcastFavorAction(triggerUser: string, targetUser: string): void;
    broadcastWinnerNotification(winnerUsername: string, coinsEarned: number): void;
    broadcastPlayerDisconnect(triggerUser: number): void;

    // Individual methods to notify a player
    notifyGameState(players: Player[], index:number, turn: number, timeOut: number): void;
    notifyDrewCard(card: Card, username: string): void;
    notifyFutureCards(cards: CardArray, username: string): void;
    notifyOkPlayedCards(username: string): void;
    
    // Get methods to request information from the frontend
    getACardType(username: string, lobbyId: string): Promise<CardType|undefined>;
    getAPlayerId(username: string, lobbyId: string): Promise<number|undefined>;
    getACard(username: string, lobbyId: string): Promise<Card|undefined>;
}