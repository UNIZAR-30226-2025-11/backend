import { CardType, Card } from "../../models/Card.js";
import { Player } from "../../models/Player.js";
import { CardArray } from "../../models/CardArray.js";

// src/services/communicationHandler.ts
export interface CommunicationHandler {
    toJSON(): {comm: number};
    notifyGameState(playedCards: CardArray, players: Player[], turn: number, timeOut: number, playerId: number): void;
    getACardType(playerId: number, lobbyId: string): Promise<CardType|undefined>;
    getAPlayerId(playerId: number, lobbyId: string): Promise<number|undefined>;
    getACard(playerId: number, lobbyId: string): Promise<Card|undefined>;
    notifyBombDefusedAction(creatorId: number): void;
    notifyPlayerLostAction(playerId: number): void;
    notifyDrewCard(card: Card, playerId: number): void;
    notifyDrawCardAction(playerId: number): void;
    notifyErrorPlayedCards(msg:string, playerId: number): void;
    notifyShuffleDeckAction(creatorId: number): void;
    notifySkipTurnAction(creatorId: number): void;
    notifyFutureAction(creatorId: number): void;
    notifyFutureCards(cards: CardArray, playerId:number): void;
    notifyAttackAction(creatorId: number, targetId: number): void;
    notifyStealFailedAction(creatorId: number, targetId: number): void;
    notifyWinner(winnerId: number, coinsEarned: number): void;
    notifyOkPlayedCards(playerId: number): void;
    notifyFavorAction(creatorId: number, targetId: number): void;
    notifyStartGame(): void;
}