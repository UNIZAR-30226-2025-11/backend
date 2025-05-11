import { z } from "zod";

const CardTypeSchema = z.enum(["Attack", "Skip", "Shuffle", "SeeFuture", "Nope", "Favor", "Deactivate", "RainbowCat", "TacoCat", "HairyPotatoCat", "Cattermelon", "BeardCat"]);
const LobbyIdSchema = z.string().length(9, "Lobby ID must be 9 characters long");

// Card schema
export const CardJSONSchema = z.object({
    id: z.number(),
    type: CardTypeSchema,
});

// FrontendGamePlayedCardsJSON
export const FrontendGamePlayedCardsJSONSchema = z.object({
    error: z.boolean(),
    errorMsg: z.string(),
    playedCards: z.array(CardJSONSchema),
    lobbyId: LobbyIdSchema,
});

// FrontendGameSelectPlayerResponseJSON
export const FrontendGameSelectPlayerResponseJSONSchema = z.object({
    error: z.boolean(),
    errorMsg: z.string(),
    playerUsername: z.string(),
    lobbyId: LobbyIdSchema,
});

// FrontendGameSelectCardResponseJSON
export const FrontendGameSelectCardResponseJSONSchema = z.object({
    error: z.boolean(),
    errorMsg: z.string(),
    card: CardJSONSchema,
    lobbyId: LobbyIdSchema,
});

// FrontendGameSelectCardTypeResponseJSON
export const FrontendGameSelectCardTypeResponseJSONSchema = z.object({
    error: z.boolean(),
    errorMsg: z.string(),
    cardType: CardTypeSchema,
    lobbyId: LobbyIdSchema,
});

// FrontendGameSelectNopeResponseJSON
export const FrontendGameSelectNopeResponseJSONSchema = z.object({
    error: z.boolean(),
    errorMsg: z.string(),
    useNope: z.boolean(),
    lobbyId: LobbyIdSchema,
});

// FrontendCreateLobbyJSON
export const FrontendCreateLobbyJSONSchema = z.object({
    error: z.boolean(),
    errorMsg: z.string(),
    maxPlayers: z.number().min(2, "Minimum number of players is 2").max(4, "Maximum number of players is 4"),
});

// FrontendJoinLobbyJSON
export const FrontendJoinLobbyJSONSchema = z.object({
    error: z.boolean(),
    errorMsg: z.string(),
    lobbyId: LobbyIdSchema,
});

// FrontendStartLobbyJSON
export const FrontendStartLobbyJSONSchema = z.object({
    error: z.boolean(),
    errorMsg: z.string(),
    lobbyId: LobbyIdSchema,
});

// FrontendPostMsgJSON
export const FrontendPostMsgJSONSchema = z.object({
    error: z.boolean(),
    errorMsg: z.string(),
    msg: z.string().min(1, "Message must be at least 1 character long"),
    lobbyId: LobbyIdSchema,
});


export const FrontendSendFriendRequestEnterLobbyJSONSchema = z.object({
    error: z.boolean(),
    errorMsg: z.string(),
    lobbyId: LobbyIdSchema,
    friendUsername: z.string(),
});


export const FrontendResponseFriendRequestEnterLobbyJSONSchema = z.object({
    error: z.boolean(),
    errorMsg: z.string(),
    lobbyId: LobbyIdSchema,
    accept: z.boolean(),
    friendSendingRequest: z.string(),
});

export const FrontendRequestConnectedFriendsJSONSchema = z.object({
    error: z.boolean(),
    errorMsg: z.string(),
    lobbyId: LobbyIdSchema,
});


export const FrontendSurrenderJSONSchema = z.object({
    error: z.boolean(),
    errorMsg: z.string(),
    lobbyId: LobbyIdSchema,
});