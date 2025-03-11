import { BackendStateUpdateJSON, BackendWinnerJSON, BackendGamePlayedCardsResponseJSON } from "../../api/socketAPI.js";
import { CardType, Card } from "../../models/Card.js";

// src/services/communicationHandler.ts
export interface CommunicationHandler {
    notifyWinner(winnerJSON: BackendWinnerJSON): void;
    toJSON(): {comm: number};
    sendGameJSON(gameJSON: BackendStateUpdateJSON , playerId: number): void;
    sendGamePlayedCardsResponseJSON(gamePlayedCardsJSON: BackendGamePlayedCardsResponseJSON, playerId: number): void;
    getACardType(playerId: number, lobbyId: string): Promise<CardType|undefined>;
    getAPlayerId(playerId: number, lobbyId: string): Promise<number|undefined>;
    getACard(playerId: number, lobbyId: string): Promise<Card|undefined>;
}