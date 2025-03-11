import {CardArray } from './CardArray.js';
import {Card, CardType} from './Card.js';

/**
 * Represents a deck of cards.
 */
export class Deck {
    /** Array containing the cards in the deck. */
    cards: CardArray;

    /**
     * Creates a new deck instance.
     * @param cards - An array of cards to initialize the deck.
     */
    constructor(cards: CardArray) {
        this.cards = cards;
    }
    
    /**
     * Creates a standard deck of cards without bombs and without
     * the number of players deactivates.
     * @param n_players - Number of players who play
     * @returns A new deck instance with a standard set of cards.
     */
    static createStandardDeck(n_players: number): Deck {
        const cards: CardArray = new CardArray([]);

        // Add a specific number of each type of card to the deck
        const cardCounts: { [key in CardType]: number } = {
            [CardType.Bomb]: 0,
            [CardType.SeeFuture]: 5,
            [CardType.Shuffle]: 5,
            [CardType.Skip]: 5,
            [CardType.Attack]: 3,
            [CardType.Nope]: 5,
            [CardType.Favor]: 5,
            [CardType.Deactivate]: 6-n_players,
            [CardType.RainbowCat]: 5,
            [CardType.TacoCat]: 100,
            [CardType.HairyPotatoCat]: 5,
            [CardType.Cattermelon]: 5,
            [CardType.BeardCat]: 5
        };

        for (const type in cardCounts) {
            for (let i = 0; i < cardCounts[type as unknown as CardType]; i++) {
                cards.push(new Card(type as unknown as CardType));
            }
        }
        const deck: Deck = new Deck(cards);
        deck.shuffle();
        return deck;
        
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
     * @param n_players - Number of players who play
     */
    add_bombs(n_players: number){
        for (let i = 0; i < n_players; i++) {
            this.cards.push(new Card(CardType.Bomb));
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
        return this.cards.pop_n(n);
    }

    /**
     * Draws the last card from the deck.
     * @returns The drawn card.
     */
    draw_last(): Card {
        return this.cards.pop();
    }

    /**
     * Show the lasts card from the deck.
     * @returns The drawn card.
     * @throws Error if the deck is empty.
     */
    peek_n(n: number): CardArray {
        if (this.cards.length() < n) {
            throw new Error('Not enough cards in the deck to peek at ' + n + ' cards');
        }
    
        return new CardArray(this.cards.values.slice(-n).reverse()); 
    }    


    /**
     * Adds a new card to the deck and shuffles it afterward.
     * @param card - The card to be added.
     */
    add_with_shuffle(card: Card): void {
        this.cards.push(card);
        this.shuffle();
    }

    toString(): string {
        return `Deck with Cards: ${this.cards.toString()}`;
    }

}