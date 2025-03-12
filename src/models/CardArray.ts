import { Card, CardType } from './Card.js';

export class CardArray {
    values: Card[];
    constructor(cards: Card[]) {
        this.values = cards;
    }

    /**
     * Shuffle the cards
     */
    shuffle(): void {
        this.values.sort(() => Math.random() - 0.5);
    }

    /**
     * Push the card
     * @param card -Card we want to push
     */
    push(card: Card): void {
        this.values.push(card);
    }

    /**
     * Give you the length of the hand
     * @returns length of the hand
     */
    length(): number {
        return this.values.length;
    }

    /**
     * Pop a card
     * @returns the card we have pop
     */
    pop(): Card {
        if (this.values.length === 0) {
            throw new Error('No cards to pop from the array');
        }
        return this.values.pop()!;
    }

    /**
     * Pop the card in a position.
     * @param n - position of the card
     * @returns The card in this position
     */
    pop_nth(n: number): Card {
        if(n<0 || n>=this.values.length){
            throw new Error('No card at position ' + n);
        }
        const card:Card = this.values[n];
        this.values.splice(n, 1); 
        return card;

    }


    /**
     * Get the last cards from the array.
     * @param n - Number of cards to get
     * @returns The last n cards from the deck.
     * @throws Error if the deck is empty.
     */
    pop_n(n: number): CardArray {
        if (this.values.length < n) {
            throw new Error('No enough cards in the array to pop ' + n + ' cards');
        }
        
        const newCards : Card[] =[];
        for (let i = 0; i < n; i++) {
            const card = this.values.pop(); // Remove the last card
            newCards.push(card!);
        };

        return new CardArray(newCards);
    }

    toJSON(): string {
        return JSON.stringify(this.values.map(card => CardType[card.type]));
    }

    toString(): string {
        return this.values.map((card:Card, index:number) => `${index}: ${CardType[card.type]}`).join(', ');
    }

    arePlayable(): boolean {
        if(!this.values.every(card => Card.isPlayable(card))){
            return false;
        }

        if(!this.allSameType()){
            return false;
        }

        if((this.length() <= 1 || this.length() > 3) && this.values.every(card => Card.isWild(card))){
            return false;
        }

        return true;

    }

    /**
     * Get if the card exist in a hand
     * @param type - Type of the card
     * @returns True if there is a card of this type, else False.
     */
    has_card(type:CardType): number {
        return this.values.findIndex(card => card.type == type);
    }

    containsAll(cards: CardArray): boolean {
        return cards.values.every(card =>
            this.values.filter(c => c.type == card.type).length >= cards.values.filter(c => c.type == card.type).length
        );
    }

    allSameType(): boolean {
        return this.values.every(card => card.type === this.values[0].type);
    }

    removeCards(cards: CardArray): void{
        cards.values.forEach(card => {
            const index = this.values.findIndex(c => c.type == card.type);
            if (index != -1) {
                this.values.splice(index, 1); // Remove only one occurrence
            }
        });
    }
}
