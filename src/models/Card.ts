

export enum CardType {
    Bomb, // Bomb card
    SeeFuture, // See the next 3 cards
    Shuffle, // Shuffle the deck
    Skip, // Skip the next player
    Attack, // Next player draws 2 cards
    Nope, // Cancel the last action
    Favor, // Force a player to give you a card
    Deactivate, // Deactivate a card
    RainbowCat, // Wild card
    TacoCat, // Wild card
    HairyPotatoCat, // Wild card
    Cattermelon, // Wild card
    BeardCat // Wild card
}


export class Card {
    type: CardType;

    constructor(type: CardType) {
        this.type = type;
    }

    /**
     * Get if the card is a wild card
     * @param type - Type of the card
     * @returns True if it is a wild card, else False.
     */
    static isWild(card: Card): boolean {
        return card.type == CardType.RainbowCat || card.type == CardType.TacoCat || card.type == CardType.HairyPotatoCat || card.type == CardType.Cattermelon || card.type == CardType.BeardCat;
    }

    static isPlayable(card: Card): boolean {
        return card.type != CardType.Bomb && card.type != CardType.Deactivate && card.type != CardType.Nope
    }
    toString(): string {
        return `Card Type (${this.type})`;
    }
}

