// -----------------------------------------------------------
// Message to update the game state
// Started by: The backend
// Listened by: Every player in the frontend with the different data.
// Ack: None
// Socket event: "game-state"
// -----------------------------------------------------------

export type BackendStateUpdateJSON = {
    error: boolean;
    errorMsg: string;
    playerCards: string;
    players: PlayerJSON[];
    turn: number;
    timeOut: number;
    playerId: number;
}

export type PlayerJSON = {
    id: number;
    numCards: number;
    active: boolean;
}

// -----------------------------------------------------------
// Message to send the played cards
// Started by: One player in the frontend
// Listened by: The backend
// Ack: Yes, with a response
// Socket-event: "game-played-cards"
// -----------------------------------------------------------

export type FrontendGamePlayedCardsJSON = {
    error: boolean;
    errorMsg: string;
    playedCards: string;
    lobbyId: string;
}


export type BackendGamePlayedCardsResponseJSON = {
    error: boolean;
    errorMsg: string;
    cardsSeeFuture: string;
    cardReceived: string;
}

// -----------------------------------------------------------
// Message to send the winner of the game
// Started by: The backend
// Listened by: Every player in the frontend
// Ack: None
// Socket-event: "winner"
// -----------------------------------------------------------

export type BackendWinnerJSON = {
    error: boolean;
    errorMsg: string;
    userId: number;
    coinsEarned: number;
}

// -----------------------------------------------------------
// Message to send a petition to select a player of the game
// Started by: The backend
// Listened by: One player in the frontend
// Ack: Yes, with a response of the selected player
// Socket-event: "game-select-player"
// -----------------------------------------------------------

export type BackendGameSelectPlayerJSON = {
    error: boolean;
    errorMsg: string;
    lobbyId: string;
}

export type FrontendGameSelectPlayerResponseJSON = {
    error: boolean;
    errorMsg: string;
    userId: number;
    lobbyId: string;
}

// -----------------------------------------------------------
// Message to send a petition to select a card of your hand
// Started by: The backend
// Listened by: One player in the frontend
// Ack: Yes, with a response of the selected card
// Socket-event: "game-select-card"
// -----------------------------------------------------------

export type BackendGameSelectCardJSON = {
    error: boolean;
    errorMsg: string;
    lobbyId: string;
}

export type FrontendGameSelectCardResponseJSON = {
    error: boolean;
    errorMsg: string;
    card: string;
    lobbyId: string;
}


// -----------------------------------------------------------
// Message to send a petition to select a type of card
// Started by: The backend
// Listened by: One player in the frontend
// Ack: Yes, a response of the selected type of card
// Socket-event: "game-select-card-type"
// -----------------------------------------------------------

export type BackendGameSelectCardTypeJSON = {
    error: boolean;
    errorMsg: string;
    lobbyId: string;
}

export type FrontendGameSelectCardTypeResponseJSON = {
    error: boolean;
    errorMsg: string;
    cardType: string;
    lobbyId: string;
}


// -----------------------------------------------------------
// Message to create a lobby
// Started by: The frontend
// Listened by: The backend
// Ack: Yes, with the lobby id
// Socket-event: "create-lobby"
// -----------------------------------------------------------
export type FrontendCreateLobbyJSON = {
    error: boolean;
    errorMsg: string;
    maxPlayers: number;
}

export type BackendCreateLobbyResponseJSON = {
    error: boolean;
    errorMsg: string;
    lobbyId: string;
}

// -----------------------------------------------------------
// Message to join a lobby
// Started by: The frontend
// Listened by: The backend
// Ack: Yes, with the lobby id
// Socket-event: "join-lobby"
// -----------------------------------------------------------
export type FrontendJoinLobbyJSON = {
    error: boolean;
    errorMsg: string;
    lobbyId: string;
}

export type BackendJoinLobbyResponseJSON = {
    error: boolean;
    errorMsg: string;
    lobbyId: string;
}

// -----------------------------------------------------------
// Message to update the lobby state
// Started by: The backend
// Listened by: Every player in the frontend with the different data.
// Ack: None
// Socket event: "lobby-state"
// -----------------------------------------------------------
export type BackendLobbyStateUpdateJSON = {
    error: boolean;
    errorMsg: string;
    players: PlayerLobbyJSON[];
}

export type PlayerLobbyJSON = {
    name: string;
    isLeader: boolean;
}

// -----------------------------------------------------------
// Message to start a lobby
// Started by: The frontend
// Listened by: The backend
// Ack: Yes, with the lobby id and the number of players
// Socket-event: "start-lobby"
// -----------------------------------------------------------
export type FrontendStartLobbyJSON = {
    error: boolean;
    errorMsg: string;
    lobbyId: string;
}

export type BackendStartLobbyResponseJSON = {
    error: boolean;
    errorMsg: string;
    numPlayers: number;
}

// -----------------------------------------------------------
// Message to inform that the game is started
// started by: The backend
// Ack: Yes
// Socket-event: "start-game"
// -----------------------------------------------------------
export type BackendStartGameResponseJSON = {
    error: boolean;
    errorMsg: string;
}


// -----------------------------------------------------------
// Message to represent an action
// Started by: The backend
// Listened by: The frontend
// Ack: None
// Socket-event: "notify-action"

export type BackendNotifyActionJSON = {
    error: boolean;
    errorMsg: string;
    creatorId: number;
    actionedPlayerId: number;
    action: string;
}
