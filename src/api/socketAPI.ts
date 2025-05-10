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
    lobbyId: string;
    playerCards: CardJSON[];
    players: PlayerJSON[];
    turnUsername: string;
    timeOut: number;
    playerUsername: string;
    cardsLeftInDeck: number;
    lastCardPlayed: CardJSON | undefined;
    turnsLeft: number;
}

export type CardJSON = {
    id: number;
    type: string;
}

export type PlayerJSON = {
    playerUsername: string;
    playerAvatar: string;
    numCards: number;
    active: boolean;
    disconnected: boolean;
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
    playedCards: CardJSON[];
    lobbyId: string;
}


export type BackendGamePlayedCardsResponseJSON = {
    error: boolean;
    errorMsg: string;
    cardsSeeFuture: CardJSON[];
    cardReceived: CardJSON;
}

// -----------------------------------------------------------
// Message to send the winner of the game
// Started by: The backend
// Listened by: Every player in the frontend
// Ack: Yes. Only the winner will send the ack
// Socket-event: "winner"
// -----------------------------------------------------------

export type BackendWinnerJSON = {
    error: boolean;
    errorMsg: string;
    winnerUsername: string;
    coinsEarned: number;
    lobbyId: string;
    isWinner: boolean;
    gameDate: Date;
    timePlayed: number;
    turnsPlayed: number;
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
    timeOut: number;
}

export type FrontendGameSelectPlayerResponseJSON = {
    error: boolean;
    errorMsg: string;
    playerUsername: string;
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
    timeOut: number;
}

export type FrontendGameSelectCardResponseJSON = {
    error: boolean;
    errorMsg: string;
    card: CardJSON;
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
    timeOut: number;
}

export type FrontendGameSelectCardTypeResponseJSON = {
    error: boolean;
    errorMsg: string;
    cardType: string;
    lobbyId: string;
}

// -----------------------------------------------------------
// Message to send a petition to use or not a Nope card
// Started by: The backend
// Listened by: One player in the frontend
// Ack: Yes, a response of the usage of the Nope card
// Socket-event: "game-select-nope"
// -----------------------------------------------------------
export type BackendGameSelectNopeJSON = {
    error: boolean;
    errorMsg: string;
    lobbyId: string;
    timeOut: number;
    nopeAction: string;
}



export type FrontendGameSelectNopeResponseJSON = {
    error: boolean;
    errorMsg: string;
    useNope: boolean;
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
    disband: boolean;
    lobbyId: string;
}

export type PlayerLobbyJSON = {
    name: string;
    isLeader: boolean;
    isYou: boolean;
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
    triggerUser: string;
    targetUser: string;
    action: string;
}


// -----------------------------------------------------------
// Message to notify a player connection or disconnection
// Started by: The backend
// Listened by: The frontend
// Ack: None
// Socket-event: "player-reconnect"
// -----------------------------------------------------------

export type BackendPlayerCanReconnectJSON = {
    error: boolean;
    errorMsg: string;
    lobbyId: string;
}
// -----------------------------------------------------------


// -----------------------------------------------------------
// Message to post a message in the chat
// Started by: The frontend
// Listened by: The backend
// Ack: None
// Socket-event: "post-message"
// -----------------------------------------------------------

export type FrontendPostMsgJSON = {
    error: boolean;
    errorMsg: string;
    msg: string;
    lobbyId: string;
}

// -----------------------------------------------------------
// Message to send all chat messages
// Started by: The backend
// Listened by: The frontend
// Ack: None
// Socket-event: "get-messages"
// -----------------------------------------------------------

export type BackendGetMessagesJSON = {

    error: boolean;
    errorMsg: string;
    messages: MsgJSON[];
    lobbyId: string;
}


export type MsgJSON = {
    msg: string;
    username: string;
    date: string;
}

// -----------------------------------------------------------
// Message to get the connected friends
// Started by: The frontend
// Listened by: The backend
// Ack: Yes, with the BackendSendConnectedFriendsJSON
// Socket-event: "get-friends-connected"
export type FrontendRequestConnectedFriendsJSON = {
    error: boolean;
    errorMsg: string;
    lobbyId: string;
}

export type BackendSendConnectedFriendsJSON = {
    error: boolean;
    errorMsg: string;
    connectedFriends: FriendSocketJSON[];
}

export type FriendSocketJSON = {
    username: string;
    avatar: string;
    connected: boolean;
    isInGame: boolean;
    isAlreadyInThisLobby: boolean;
}

// -----------------------------------------------------------
// Message to send a friend request to join a lobby
// Started by: The frontend
// Listened by: The backend
// Ack: Yes, with the BackendResponseFriendRequestEnterLobbyJSON
// Socket-event: "send-friend-join-lobby-request"
// -----------------------------------------------------------

export type FrontendSendFriendRequestEnterLobbyJSON = {
    error: boolean;
    errorMsg: string;
    lobbyId: string;
    friendUsername: string;
}

export type BackendResponseFriendRequestEnterLobbyJSON = {
    error: boolean;
    errorMsg: string;
    lobbyId: string;
    friendUsername: string;
    accept: boolean;
}


// -----------------------------------------------------------
// Message to send a friend request to join a lobby
// Started by: The backend
// Listened by: The friend that is going to receive the request
// Ack: Yes, with the FrontendResponseFriendRequestEnterLobbyJSON
// Socket-event: "receive-friend-join-lobby-request"
// -----------------------------------------------------------

export type BackendSendFriendRequestEnterLobbyJSON = {
    error: boolean;
    errorMsg: string;
    lobbyId: string;
    friendSendingRequest: string;
    friendSendingRequestAvatar: string;
}

export type FrontendResponseFriendRequestEnterLobbyJSON = {
    error: boolean;
    errorMsg: string;
    lobbyId: string;
    accept: boolean;
    friendSendingRequest: string;
}
