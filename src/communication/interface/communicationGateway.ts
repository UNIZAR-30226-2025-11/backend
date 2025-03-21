import { CardType, Card } from "../../models/Card.js";
import { Player } from "../../models/Player.js";
import { CardArray } from "../../models/CardArray.js";

export interface CommunicationGateway {

    // Broadcast methods to notify all players
    broadcastBombDefusedAction(creatorId: number): void;
    broadcastPlayerLostAction(playerId: number): void;
    broadcastDrawCardAction(playerId: number): void;
    broadcastShuffleDeckAction(creatorId: number): void;
    broadcastSkipTurnAction(creatorId: number): void;
    broadcastFutureAction(creatorId: number): void;
    broadcastAttackAction(creatorId: number, targetId: number): void;
    broadcastStealFailedAction(creatorId: number, targetId: number): void;
    broadcastWinnerNotification(winnerId: number, coinsEarned: number, lobbyId: string): void;
    broadcastFavorAction(creatorId: number, targetId: number): void;
    broadcastStartGame(): void;
    broadcastPlayerDisconnect(playerId: number): void;

    // Individual methods to notify a player
    notifyGameState(playedCards: CardArray, players: Player[], turn: number, timeOut: number, playerId: number): void;
    notifyDrewCard(card: Card, playerId: number): void;
    notifyErrorPlayedCards(msg:string, playerId: number): void;
    notifyFutureCards(cards: CardArray, playerId:number): void;
    notifyOkPlayedCards(playerId: number): void; 
    
    // Get methods to request information from the frontend
    getACardType(playerId: number, lobbyId: string): Promise<CardType|undefined>;
    getAPlayerId(playerId: number, lobbyId: string): Promise<number|undefined>;
    getACard(playerId: number, lobbyId: string): Promise<Card|undefined>;
}