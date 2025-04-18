export enum ActionType {
    
    // Related to shuffle
    ShuffleDeck,
    
    // Related to attacks
    Attack,
    AttackFailed,
    AttackSuccessful,

    // Related to card receive
    CardReceived,

    // Related to bombs
    BombDefused,
    BombExploded,

    // Related to draw a card
    DrawCard,

    // Related to skip turn
    SkipTurn,
    SkipTurnFailed,
    SkipTurnSuccessful,

    // Related to see future
    FutureSeen,

    // Related to nope usage
    NopeUsed,
    NopeNotUsed,

    // Related to favor attack
    FavorAttack,
    FavorAttackFailed,
    FavorAttackSuccessful,

    // Related to two wild card attack
    TwoWildCardAttack,
    TwoWildCardAttackFailed,
    TwoWildCardAttackSuccessful,

    // Related to three wild card attack
    ThreeWildCardAttack,
    ThreeWildCardAttackFailed,
    ThreeWildCardAttackSuccessful,

    // Related to asking plays
    AskingNope,
    AskingPlayer,
    AskingCard,
    AskingCardType,

    // Reconnecting
    Reconnection,
    Disconnection,
}