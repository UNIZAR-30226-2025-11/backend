import { z } from "zod";

// Card schema
export const CardJSONSchema = z.object({
    id: z.number(),
    type: z.string(),
});

// FrontendGamePlayedCardsJSON
export const FrontendGamePlayedCardsJSONSchema = z.object({
    error: z.boolean(),
    errorMsg: z.string(),
    playedCards: z.array(CardJSONSchema),
    lobbyId: z.string(),
});

// FrontendWinnerResponseJSON
export const FrontendWinnerResponseJSONSchema = z.object({
    error: z.boolean(),
    errorMsg: z.string(),
    winnerUsername: z.string(),
    coinsEarned: z.number(),
    lobbyId: z.string(),
});

// FrontendGameSelectPlayerResponseJSON
export const FrontendGameSelectPlayerResponseJSONSchema = z.object({
    error: z.boolean(),
    errorMsg: z.string(),
    playerUsername: z.string(),
    lobbyId: z.string(),
});

// FrontendGameSelectCardResponseJSON
export const FrontendGameSelectCardResponseJSONSchema = z.object({
    error: z.boolean(),
    errorMsg: z.string(),
    card: CardJSONSchema,
    lobbyId: z.string(),
});

// FrontendGameSelectCardTypeResponseJSON
export const FrontendGameSelectCardTypeResponseJSONSchema = z.object({
    error: z.boolean(),
    errorMsg: z.string(),
    cardType: z.string(),
    lobbyId: z.string(),
});

// FrontendGameSelectNopeResponseJSON
export const FrontendGameSelectNopeResponseJSONSchema = z.object({
    error: z.boolean(),
    errorMsg: z.string(),
    useNope: z.boolean(),
    lobbyId: z.string(),
});

// FrontendCreateLobbyJSON
export const FrontendCreateLobbyJSONSchema = z.object({
    error: z.boolean(),
    errorMsg: z.string(),
    maxPlayers: z.number(),
});

// FrontendJoinLobbyJSON
export const FrontendJoinLobbyJSONSchema = z.object({
    error: z.boolean(),
    errorMsg: z.string(),
    lobbyId: z.string(),
});

// FrontendStartLobbyJSON
export const FrontendStartLobbyJSONSchema = z.object({
    error: z.boolean(),
    errorMsg: z.string(),
    lobbyId: z.string(),
});

// FrontendPostMsgJSON
export const FrontendPostMsgJSONSchema = z.object({
    error: z.boolean(),
    errorMsg: z.string(),
    msg: z.string(),
    lobbyId: z.string(),
});