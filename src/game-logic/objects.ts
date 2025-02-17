const INITIAL_HAND_SIZE = 7;

enum CardType {
    Bomb, // Bomb card
    SeeFuture, // See the next 3 cards
    Shuffle, // Shuffle the deck
    Skip, // Skip the next player
    Attack, // Next player draws 2 cards
    Nope, // Cancel the last action
    Favor, // Force a player to give you a card
    Deactivate, // Deactivate a card
    RainbowCat, // Wild card
    PotatoCat, // Wild card
    TacoCat, // Wild card
    HairyPotatoCat, // Wild card
    Cattermelon, // Wild card
    BeardCat // Wild card
}


class Card {
    type: CardType;

    constructor(type: CardType) {
        this.type = type;
    }
}


/**
 * Represents a deck of cards.
 */
class Deck {
    /** Array containing the cards in the deck. */
    cards: Card[];

    /**
     * Creates a new deck instance.
     * @param cards - An array of cards to initialize the deck.
     */
    constructor(cards: Card[]) {
        this.cards = cards;
    }
    
    /**
     * Creates a standard deck of cards without bombs and without
     * the number of players deactivates.
     * @param n_players - Number of players who play
     * @returns A new deck instance with a standard set of cards.
     */
    static createStandardDeck(n_players: number): Deck {
        const cards: Card[] = [];

        // Add a specific number of each type of card to the deck
        const cardCounts: { [key in CardType]: number } = {
            [CardType.Bomb]: 0,
            [CardType.SeeFuture]: 5,
            [CardType.Shuffle]: 4,
            [CardType.Skip]: 4,
            [CardType.Attack]: 4,
            [CardType.Nope]: 5,
            [CardType.Favor]: 4,
            [CardType.Deactivate]: 6-n_players,
            [CardType.RainbowCat]: 4,
            [CardType.PotatoCat]: 4,
            [CardType.TacoCat]: 4,
            [CardType.HairyPotatoCat]: 4,
            [CardType.Cattermelon]: 4,
            [CardType.BeardCat]: 4
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
        this.cards.sort(() => Math.random() - 0.5);
    }

    /**
     * Add the cards of Boom
     * @param n_players - Number of players who play
     */
    add_bombs(n_players: number){
        for (let i = 0; i < n_players-1; i++) {
            this.cards.push(new Card(CardType.Bomb));
        }
        this.shuffle();
    }

    /**
     * Draws the last card from the deck.
     * @returns The drawn card.
     * @throws Error if the deck is empty.
     */
    draw(n:number): Card[] {
        if (this.cards.length < n) {
            throw new Error('No enough cards in the deck to draw ' + n + ' cards');
        }
        
        const newCards : Card[] =[];
        for (let i = 0; i < n; i++) {
            const card = this.cards.pop()!; // Remove the last card
            newCards.push(card);
        };

        return newCards;
    }

    /**
     * Adds a new card to the deck and shuffles it afterward.
     * @param card - The card to be added.
     */
    add_with_shuffle(card: Card): void {
        this.cards.push(card);
        this.shuffle();
    }

}


class Player {
    id: number;
    hand: Card[];
    
    constructor(id: number, hand: Card[]) {
        this.id = id;
        this.hand = hand;
    }
    
    static createStandarPlayer(id:number, deck: Deck): Player {
        // Create a hand with 7 cards
        const hand = deck.draw(INITIAL_HAND_SIZE);
        
        // Add the deactive card 
        hand.push(new Card(CardType.Deactivate));
        return new Player(id, hand);
    }
}


class State {
    active_players: Player[];
    unactive_players: Player[];
    deck: Deck;
    turn: number;
    
    constructor(active_players: Player[], unactive_players: Player[], deck: Deck, turn: number) {
        this.active_players = active_players;
        this.unactive_players = unactive_players;
        this.deck = deck;
        this.turn = turn;
    }
    
}

class GameObject {
    id: number;
    number_of_players: number;
    state: State;
    
    constructor(id: number, number_of_players: number) {
        this.id = id;
        const deck  = Deck.createStandardDeck(number_of_players);
        
        // Create players with 7 cards
        const players : Player[] = [];
        for(let i = 0; i < number_of_players; i++){
            players.push(Player.createStandarPlayer(i, deck));
        }
        
        // Add bombs to the deck
        deck.add_bombs(number_of_players);
        
        this.number_of_players = number_of_players;
        this.state = new State(players, [], deck, 0);
    }

}
