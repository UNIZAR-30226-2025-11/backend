export { CardType, Card, Deck, Player, GameObject, CardArray, AttackType };

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


class CardArray {
    values: Card[];
    constructor(cards: Card[]) {
        this.values = cards;
    }

    shuffle(): void {
        this.values.sort(() => Math.random() - 0.5);
    }

    push(card: Card): void {
        this.values.push(card);
    }

    length(): number {
        return this.values.length;
    }

    pop(): Card {
        if (this.values.length === 0) {
            throw new Error('No cards to pop from the array');
        }
        return this.values.pop()!;
    }

    pop_nth(n: number): Card {
        try {
            const card:Card = this.values[n];
            this.values.splice(n, 1); 
            return card;
        } catch (error) {
            throw new Error('Impossible to get the card ${n}');
        }
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

    get_n(n: number): CardArray {
        if (this.values.length < n) {
            throw new Error('No enough cards in the array to get ' + n + ' cards');
        }
        
        const newCards : Card[] =[];
        for (let i = 0; i < n; i++) {
            const card = this.values[this.values.length-1-i]; // Remove the last card
            newCards.push(card);
        };

        return new CardArray(newCards);
    }

    toString(): string {
        return this.values.map((card:Card, index:number) => `${index}: ${CardType[card.type]}`).join(', ');
    }

    has_card(type:CardType): number {
        return this.values.findIndex(card => card.type == type);
    }

}

/**
 * Represents a deck of cards.
 */
class Deck {
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
        this.cards.shuffle();
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
     * @param n - Number of cards to draw
     * @returns The drawn card.
     * @throws Error if the deck is empty.
     */
    draw(n:number): CardArray {
        return this.cards.pop_n(n);
    }

    draw_one(): Card {
        return this.cards.pop();
    }

    get_n(n: number): CardArray {
        return this.cards.get_n(n);
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


class Player {
    id: number;
    hand: CardArray;
    
    constructor(id: number, hand: CardArray) {
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

class PlayerArray {
    values: Player[];
    constructor(players: Player[]) {
        this.values = players;
    }
    
    get(n:number): Player {
        try {
            return this.values[n];
        }
        catch (error) {
            throw new Error('Impossible to get the player ${n}');
        }
    }

    get_by_id(id:number): Player {
        try {
            return this.values.find(player => player.id === id)!;
        }
        catch (error) {
            throw new Error('Impossible to get the player ${id}');
        }
    }

    toString(): string {
        return this.values.map((player:Player) => `Player: ${player.id}`).join(', ');
    }

    length(): number {
        return this.values.length;
    }

    remove(n: number): void {
        this.values.splice(n, 1);
    }

    add(player: Player): void {
        this.values.push(player);
    }

}


class Move {
    played_card: Card;
    player: Player;

    constructor(played_card: Card, player: Player) {
        this.played_card = played_card;
        this.player = player;
    }
}


class MoveHistory {
    moves: Move[];

    constructor() {
        this.moves = [];
    }

    add_move(move: Move): void {
        this.moves.push(move);
    }

    get_last_move(): Move {
        if (this.moves.length === 0) {
            throw new Error('No moves to pop from the history');
        }
        return this.moves[this.moves.length - 1];
    }
}

enum AttackType {
    Attack,
    Favor
}

class GameObject {
    id: number;
    number_of_players: number;
    active_players: PlayerArray;
    unactive_players: PlayerArray;
    deck: Deck;
    turn: number;
    has_winner: boolean = false;
    callSystem: CallSystem;
    movesHistory: MoveHistory;
    
    constructor(id: number, number_of_players: number, callSystem: CallSystem) {
        this.id = id;
        this.callSystem = callSystem;
        this.movesHistory = new MoveHistory();
        
        const deck  = Deck.createStandardDeck(number_of_players);
        
        // Create players with 7 cards
        const players : Player[] = [];
        for(let i = 0; i < number_of_players; i++){
            players.push(Player.createStandarPlayer(i, deck));
        }
        
        // Add bombs to the deck
        deck.add_bombs(number_of_players);
        
        this.number_of_players = number_of_players;
        this.active_players=new PlayerArray(players);
        this.unactive_players= new PlayerArray([]);
        this.deck=deck;
        this.turn = 0;
        this.has_winner=false;
    }

    resolve_nope_chain(current_player:Player, attacked_player:Player, card_type:CardType, type_attack:AttackType): boolean {
        this.callSystem.notify_attack(attacked_player, type_attack);
        
        let resolved = false;
        const players = [current_player, attacked_player];
        let player_to_nope = 1;
        while(!resolved){
            const index_nope = players[player_to_nope].hand.has_card(CardType.Nope);
            if(index_nope !== -1){
                const used_nope = this.callSystem.get_nope_card();
                if(used_nope){
                    players[player_to_nope].hand.pop_nth(index_nope);
                    player_to_nope = (player_to_nope + 1) % 2;
                } else {
                    resolved = true;
                }
            } else {
                resolved = true;
            }
        }

        this.callSystem.notify_attack_result(attacked_player, current_player, type_attack, player_to_nope===1);
        
        return player_to_nope === 1;

    }

    play_turn(): void {
        
        while(!this.has_winner){
            
            // Get the current player
            const current_player: Player = this.active_players.get(this.turn);
            
            this.callSystem.broad_cast_player_turn(current_player);
            
            this.callSystem.notify_current_hand(current_player);
            
            const played_card_id:number = this.callSystem.get_played_cards();
            
            if(played_card_id == -1){
                // Draw a cart
                const newCards: Card = this.deck.draw_one();
                this.handle_new_card(newCards, current_player);
            } else 
            {
                // Get the card from the player
                const card = current_player.hand.pop_nth(played_card_id);
                
                this.play_card(card, current_player);   
            }
        }
    }

    /**
     * See the next 3 cards of the deck
     * @param current_player - The player who is playing the card
     */
    see_future(current_player: Player): void{
        const cards: CardArray = this.deck.get_n(3);

        this.callSystem.notify_hidden_cards(cards, current_player);

    }

    // Sonia
    attack(current_player: Player): void{
        throw new Error('Not implemented');
    }

    // David
    favor(current_player: Player): void{
        const player_to_steal: Player = this.active_players.get_by_id(this.callSystem.get_a_player_id());

        if(player_to_steal.hand.length() === 0){
            throw new Error('Player has no cards to steal');
        }

        if(player_to_steal === current_player){
            throw new Error('Player cannot steal from itself');
        }

        if(!this.resolve_nope_chain(current_player, player_to_steal, CardType.Favor, AttackType.Favor)){
            return;
        }
        
        const card_id: number = this.callSystem.give_a_selected_card(player_to_steal);
        const card_to_steal: Card = player_to_steal.hand.pop_nth(card_id);

        current_player.hand.push(card_to_steal);

        this.callSystem.notify_new_cards(current_player);
        
    }

    // David
    play_wild_card(card_type: CardType, current_player: Player): void{
        throw new Error('Not implemented');
    }


    play_card(card: Card, current_player:Player): void {
        console.log(`Playing Card ${CardType[card.type]}`);
        if (card.type == CardType.SeeFuture)
        {
            this.see_future(current_player);
        }
        else if (card.type == CardType.Shuffle){
            this.deck.shuffle();
        }
        else if (card.type == CardType.Skip){
            this.turn = (this.turn + 1) % this.active_players.length();
        }
        else if (card.type == CardType.Attack){
            this.attack(current_player);
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
            const indexDeactivate = player.hand.values.findIndex( card => card.type === CardType.Deactivate );

            if (indexDeactivate !== -1) {

                this.callSystem.notify_bomb_defused(player);
                
                player.hand.pop_nth(indexDeactivate); // Remove the deactivate card
                
                this.callSystem.broad_cast_notify_bomb_defused(player);
                this.deck.add_with_shuffle(newCard);
                
            } else {

                this.callSystem.broad_cast_notify_bomb_exploded(player);
                
                this.unactive_players.add(player);
                this.active_players.remove(this.turn);

            }
        } else{
            player.hand.push(newCard);
            this.callSystem.notify_new_cards(player);
        }
    }
}
