import { CardJSON } from "../api/socketAPI.js";


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
    id: number;

    constructor(id:number, type: CardType) {
        this.id = id;
        this.type = type;
    }


    static fromJSON(card: CardJSON): Card {
        return new Card(card.id, CardType[card.type as keyof typeof CardType] as CardType);
    }

    toString(): string {
        return this.id + " --> " + CardType[this.type];
    }

    toJSON(): CardJSON {
        return {
            id: this.id,
            type: CardType[this.type]
        };
    }

    equals(card: Card): boolean {
        return this.id == card.id && this.type == card.type;
    }

    /**
     * Get if the card is a wild card
     * @param type - Type of the card
     * @returns True if it is a wild card, else False.
     */
    static isWild(card: Card): boolean {
        return card.type == CardType.RainbowCat || card.type == CardType.TacoCat || card.type == CardType.HairyPotatoCat || card.type == CardType.Cattermelon || card.type == CardType.BeardCat;
    }

    static isAttack(card: Card): boolean {
        return card.type == CardType.Attack || this.isWild(card) || card.type == CardType.Favor;
    }

    static isPlayable(card: Card): boolean {
        return card.type != CardType.Bomb && card.type != CardType.Deactivate && card.type != CardType.Nope
    }

}

