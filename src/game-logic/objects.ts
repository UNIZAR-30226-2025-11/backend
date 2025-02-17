export { CardType, Card, Deck, Player, GameObject };

import {CallSystem} from './calls.js';

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

    static is_wild(type: CardType): boolean {
        return type == CardType.RainbowCat || type == CardType.PotatoCat || type == CardType.TacoCat || type == CardType.HairyPotatoCat || type == CardType.Cattermelon || type == CardType.BeardCat;
    }

    toString(): string {
        return `Card Type (${this.type})`;
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
     * Show the lasts card from the deck.
     * @returns The drawn card.
     * @throws Error if the deck is empty.
     */
    peek(n: number): Card[] {
        if (this.cards.length < n) {
            throw new Error('Not enough cards in the deck to peek at ' + n + ' cards');
        }
    
        return this.cards.slice(-n); 
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
        const str: string = this.cards.map((card:Card, index:number) => `${index}: ${CardType[card.type]}`).join(', ');
        return `Deck with Cards: ${str})`;
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
    
    toString(): string {
        return 'Player' + this.id + ' with Cards' + this.hand.toString();
    }
}


class GameObject {
    id: number;
    number_of_players: number;
    active_players: Player[];
    unactive_players: Player[];
    deck: Deck;
    turn: number;
    has_winner: boolean = false;
    callSystem: CallSystem;
    
    constructor(id: number, number_of_players: number, callSystem: CallSystem) {
        this.id = id;
        this.callSystem = callSystem;
        const deck  = Deck.createStandardDeck(number_of_players);
        
        // Create players with 7 cards
        const players : Player[] = [];
        for(let i = 0; i < number_of_players; i++){
            players.push(Player.createStandarPlayer(i, deck));
        }
        
        // Add bombs to the deck
        deck.add_bombs(number_of_players);
        
        this.number_of_players = number_of_players;
        this.active_players=players;
        this.unactive_players= [];
        this.deck=deck;
        this.turn = 0;
        this.has_winner=false;
    }

    play_turn(): void {
        
        while(!this.has_winner){
            
            // Get the current player
            const current_player: Player = this.active_players[this.turn];
            
            console.log(`Player ${current_player.id} turn`);
            console.log('Hand: ' + current_player.hand.map((card:Card, index:number) => `${index}: ${CardType[card.type]}`).join(', '));
            const played_card_id:number = this.callSystem.get_played_cards();
            
            if(played_card_id == -1){
                // Draw a cart
                const newCards: Card = this.deck.draw(1)[0];
                this.handle_new_card(newCards, current_player);
                this.turn = (this.turn+1) % this.active_players.length;

            } else 
            {
                const card = current_player.hand[played_card_id];

                // Remove card from hand
                current_player.hand.splice(played_card_id, 1);
                
                this.play_card(card, current_player);   
            }
        }
    }

    see_future(current_player: Player): void{
        console.log( `Player ${current_player.id} see the future` );
        const nextCards = this.deck.peek(3);
        console.log( `The next cards are `+ nextCards.reverse().map((card:Card, index: number) => `${index + 1}. ${CardType[card.type]}` ).join(', '));

            
    }

    attack(current_player: Player): void{
        this.turn = (this.turn + 1) % this.active_players.length;

        // Get the new current player
        current_player = this.active_players[this.turn];
            
        console.log(`Player ${current_player.id} turn`);
        console.log('Hand: ' + current_player.hand.map((card:Card, index:number) => `${index}: ${CardType[card.type]}`).join(', '));
        let played_card_id:number = this.callSystem.get_played_cards();
        while (played_card_id !== -1){
            const card = current_player.hand[played_card_id];

            // Remove card from hand
            current_player.hand.splice(played_card_id, 1);
            
            this.play_card(card, current_player);   

            console.log(`Player ${current_player.id} turn`);
            console.log('Hand: ' + current_player.hand.map((card:Card, index:number) => `${index}: ${CardType[card.type]}`).join(', '));
            played_card_id = this.callSystem.get_played_cards();
        }
        // Draw a cart
        const newCards: Card = this.deck.draw(1)[0];
        this.handle_new_card(newCards, current_player);

    }

    nope(current_player: Player): void{
        throw new Error('Not implemented');
    }

    favor(current_player: Player): void{
        throw new Error('Not implemented');
    }

    play_wild_card(card_type: CardType, current_player: Player): void{
        const chose_player=this.callSystem.get_played_favor(this.number_of_players);
        const length: number = this.active_players[chose_player].hand.length;

        if (length === 0) {
            console.log(`Player ${chose_player} has no cards to steal.`);
        } else {
            // Chose a random value
            const randomIndex = Math.floor(Math.random() * length);
        
            // extract the card
            const newCard: Card = this.active_players[chose_player].hand.splice(randomIndex, 1)[0];
        
            // Agregar la carta robada a la mano del jugador actual
            current_player.hand.push(newCard);
        
            console.log(`Player ${current_player.id} stole a ${CardType[newCard.type]} card from Player ${chose_player}`);
        }

    }


    play_card(card: Card, current_player:Player): void {
        console.log(`Playing Card ${card.type}`);
        if (card.type == CardType.SeeFuture)
        {
            this.see_future(current_player);
        }
        else if (card.type == CardType.Shuffle){
            this.deck.shuffle();
        }
        else if (card.type == CardType.Skip){
            this.turn = (this.turn + 1) % this.active_players.length;
        }
        else if (card.type == CardType.Attack){
            this.attack(current_player);
        } 
        else if (card.type == CardType.Nope){
            this.nope(current_player);
        }
        else if (card.type == CardType.Favor){
            this.favor(current_player);
        }
        else if (Card.is_wild(card.type)){
            this.play_wild_card(card.type, current_player);
        }
        else{
            throw new Error('Invalid card type to play: ' + CardType[card.type]);
        }

    }

    handle_new_card(newCard: Card, player: Player){
        if (newCard.type === CardType.Bomb) {
            const indexDeactivate = player.hand.findIndex( card => card.type === CardType.Deactivate );

            if (indexDeactivate !== -1) {
                console.log(`Player ${player.id} defused the bomb!`);
                
                player.hand.splice(indexDeactivate, 1); // Remove the deactivate card
                
                console.log("Putting back the bomb...")
                this.deck.add_with_shuffle(newCard); // Put the bomb back

            } else {
                console.log(`Player ${player.id} exploded!`);
                this.unactive_players.push(player);
                this.active_players.splice(this.turn, 1);
                this.turn = this.turn % this.active_players.length;
            }
        } else{
            player.hand.push(newCard);
        }
    }
}
