import {CardArray } from './CardArray.js';
import {Card, CardType} from './Card.js';

/**
 * Represents a deck of cards.
 */
export class Deck {
    /** Array containing the cards in the deck. */
    cards: CardArray;
    id: number;

    /**
     * Creates a new deck instance.
     * @param cards - An array of cards to initialize the deck.
     */
    constructor() {
        this.cards = new CardArray([]);
        this.id = 0;
    }

    getNewCard(cardType: CardType): Card {
        return new Card(this.id++, cardType);
    }

    addNewCard(cardType: CardType): void {
        this.cards.push(this.getNewCard(cardType));
    }

    addCards(cardsTypes:  { [key in CardType]: number }): void {
        for (const cardType in cardsTypes) {
            for (let i = 0; i < cardsTypes[cardType as unknown as CardType]; i++) {
                this.addNewCard(cardType as unknown as CardType);
            }
        }
    }

    length(): number {
        return this.cards.length();
    }

    /**
     * Shuffles the deck by randomly rearranging the cards.
     * Uses the `.sort()` method with `Math.random()`.
     */
    shuffle(): void {
        this.cards.shuffle();
    }

    /**
     * Add the cards of Boom
     * @param numPlayers - Number of players who play
     */
    addBombs(numPlayers: number){
        for (let i = 0; i < numPlayers-1; i++) {
            this.addNewCard(CardType.Bomb);
        }
        this.shuffle();
    }

    /**
     * Draws the last card from the deck.
     * @param n - Number of cards to draw
     * @returns The drawn card.
     * @throws Error if the deck is empty.
     */
    draw(n:number): CardArray {
        return this.cards.popN(n);
    }

    /**
     * Draws the last card from the deck.
     * @returns The drawn card.
     */
    drawLast(): Card {
        return this.cards.pop();
    }

    /**
     * Show the lasts card from the deck.
     * @returns The drawn card.
     * @throws Error if the deck is empty.
     */
    peekN(n: number): CardArray {
        const actuallNumberToPeek = Math.min(n, this.cards.length());
        return new CardArray(this.cards.values.slice(-actuallNumberToPeek).reverse()); 
    }    


    /**
     * Adds a new card to the deck and shuffles it afterward.
     * @param card - The card to be added.
     */
    addWithShuffle(card: Card): void {
        this.cards.push(card);
        this.shuffle();
    }

    toString(): string {
        return `Deck with Cards: ${this.cards.toString()}`;
    }

}