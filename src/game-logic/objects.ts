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
            [CardType.SeeFuture]: 0,
            [CardType.Shuffle]: 0,
            [CardType.Skip]: 10,
            [CardType.Attack]: 10,
            [CardType.Nope]: 10,
            [CardType.Favor]: 10,
            [CardType.Deactivate]: 6-n_players,
            [CardType.RainbowCat]: 0,
            [CardType.PotatoCat]: 500,
            [CardType.TacoCat]: 0,
            [CardType.HairyPotatoCat]: 0,
            [CardType.Cattermelon]: 0,
            [CardType.BeardCat]: 0
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
    Favor,
    Skip
}

class GameObject {
    id: number;
    number_of_players: number;
    active_players: Player[];
    unactive_players: Player[];
    deck: Deck;
    turn: number;
    number_of_turns_left: number;
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
        this.active_players= players;
        this.unactive_players= [];
        this.deck=deck;
        this.turn = 0;
        this.has_winner=false;
        this.number_of_turns_left = 1;
    }

    next_player(): number {
        return (this.turn + 1) % this.active_players.length;
    }

    set_next_turn(): void {
        if(this.number_of_turns_left > 1)
        {
            this.number_of_turns_left -= 1;
        } else {
            this.turn = (this.turn + 1) % this.active_players.length;
        }
    }

    /**
     * Play a turn of the game. It will keep playing until there is a winner.
     */
    play_turn(): void {
        
        while(!this.has_winner){
            // While there is no winner
            
            // Get the current player
            const current_player: Player = this.active_players[this.turn];
            
            // Broadcast the player turn
            this.callSystem.broad_cast_player_turn(current_player);
            

            // Notify the current hand of the player
            this.callSystem.notify_current_hand(current_player);
            
            // Get the played cards
            const played_cards_ids:number[] = this.callSystem.get_played_cards(current_player);
            
            if(played_cards_ids.length === 0 ){ 
                // If the player does not play a card

                // Draw the last card from the deck
                const newCards: Card = this.deck.draw_last();

                // Handle the new card received
                this.handle_new_card(newCards, current_player);
                
                // Set the next turn
                this.set_next_turn();

            } else 
            {
                // If the player plays cards

                const card_played: Card = current_player.hand.pop_nth(played_cards_ids[0]);

                for(let i=1;i<played_cards_ids.length;i++){
                    const card:Card = current_player.hand.pop_nth(played_cards_ids[i]);
                    if (card.type !== card_played.type){
                        // If the cards played are not of the same type
                        throw new Error('All played cards must be of the same type');
                    }
                }
            
                const number_of_played_cards = played_cards_ids.length;
                
                // Play the card
                this.play_card(card_played, number_of_played_cards, current_player);   
            }

            // Check if the player has won
            if(this.active_players.length === 1){
                this.has_winner = true;
            }
        }

        // Notify the winner
        this.callSystem.broad_cast_notify_winner(this.active_players[0]);
    }


    /**
     * Function that handles the playing of a card
     * @param card - The card to play
     * @param current_player - The player who is playing the card
     */
    play_card(card: Card, number_of_played_cards:number, current_player:Player): void {
        
        // Notify the players that the card has been used
        this.callSystem.broad_cast_card_used(current_player, card.type, number_of_played_cards);

        if (card.type == CardType.SeeFuture){
            this.see_future(current_player);
        }
        else if (card.type == CardType.Shuffle){
            this.shuffle();
        }
        else if (card.type == CardType.Skip){
            this.skip_turn(current_player);
        }
        else if (card.type == CardType.Attack){
            this.attack(current_player);
        } 
        else if (card.type == CardType.Favor){
            this.favor(current_player);
        }
        else if (Card.is_wild(card.type)){
            this.play_wild_card(card.type, number_of_played_cards, current_player);
        }
        else{
            throw new Error('Invalid card type to play: ' + CardType[card.type]);
        }
    }


    
    /**
     * Handle the reception of a new card.
     * @param newCard - The new card to handle
     * @param player - The player who receives the card
     */
    handle_new_card(newCard: Card, player: Player){

        
        if (newCard.type === CardType.Bomb) {
            // If the card is a bomb

            // Check if the player has a deactivate card
            const indexDeactivate = player.hand.values.findIndex( card => card.type === CardType.Deactivate );

            if (indexDeactivate !== -1) {
                // If the player has a deactivate card
                
                // Notify the player that the bomb has been defused
                this.callSystem.notify_bomb_defused(player);
                
                // Remove the deactivate card from the player
                player.hand.pop_nth(indexDeactivate); 
                
                // Notify the rest of the players that the bomb has been defused and it will go back to the deck
                this.callSystem.broad_cast_notify_bomb_defused(player);

                this.callSystem.notify_new_cards(player);
                // Add the bomb back to the deck
                this.deck.add_with_shuffle(newCard);
                
            } else {
                // If the player does not have a deactivate card

                // Notify the rest of the players that the bomb has exploded and therefore the player is out of the game
                this.callSystem.broad_cast_notify_bomb_exploded(player);
                
                // Remove the player from the active players
                this.active_players.splice(this.turn, 1);

                // Add the player to the unactive players
                this.unactive_players.push(player);

            }
        } else{
            // If the card is not a bomb

            // Add the card to the player's hand
            player.hand.push(newCard);

            // Notify the player that it has new cards
            this.callSystem.notify_new_cards(player);
        }
    }

    /**
     * Function that resolves the Nope chain of cards.
     * @param current_player - Current player who is playing the card
     * @param attacked_player - Player who is being attacked
     * @param card_type - Card type that is being played
     * @param type_attack - Type of attack that is being played
     * @returns True if the attack is successful, false otherwise
     */
    resolve_nope_chain(current_player:Player, attacked_player:Player, card_type:CardType, type_attack:AttackType): boolean {
        
        // Notify the attack
        this.callSystem.notify_attack(attacked_player, type_attack);
        
        let resolved: boolean = false;
        const players = [current_player, attacked_player];
        let player_to_nope = 1;

        while(!resolved){
            // While the nope chain is not resolved

            // Check if the player has a nope card
            const index_nope = players[player_to_nope].hand.has_card(CardType.Nope);
            
            if(index_nope !== -1){
                // If the player has a nope card

                // Ask the player if he wants to use the nope card
                const used_nope = this.callSystem.get_nope_card(players[player_to_nope]);
                if(used_nope){
                    // If the player uses the nope card

                    // Remove the nope card from the player
                    players[player_to_nope].hand.pop_nth(index_nope);

                    // Notify the rest of the players that the nope card has been used
                    this.callSystem.broad_cast_card_used(players[player_to_nope], CardType.Nope, 1);

                    // Switch the player to nope
                    player_to_nope = (player_to_nope + 1) % 2;
                } else {
                    // If the player does not use the nope card

                    // The nope chain is resolved
                    resolved = true;
                }
            } else {
                // If the player does not have a nope card

                // The nope chain is resolved
                resolved = true;
            }
        }

        // Notify the result of the attack
        this.callSystem.notify_attack_result(attacked_player, current_player, type_attack, player_to_nope===1);
        
        // Return if the attack is successful
        return player_to_nope === 1;

    }

    /**
     * Shuffle the deck.
     */
    shuffle(): void{

        // Randomly shuffle the deck
        this.deck.shuffle();
    }

    /**
     * Tries to skip the turn if the following player doesn't nope him.
     * @param current_player - The player who is playing the card
     */
    skip_turn(current_player:Player): void{

        const following_player = this.active_players[this.next_player()];
        if(!this.resolve_nope_chain(current_player, following_player, CardType.Skip, AttackType.Skip))
        {
            return;
        }

        // If the skip is not noped, change the turn
        this.set_next_turn();
    }


    /**
     * Shows the next 3 cards of the deck to the current player.
     * @param current_player - The player who is playing the card
     */
    see_future(current_player: Player): void{

        // Get the next 3 cards
        const nextCards: CardArray = this.deck.peek_n(3);

        // Notify the player of the next cards
        this.callSystem.notify_hidden_cards(nextCards, current_player);
    }

    /**
     * Performs an attack to the next player.
     * @param current_player - The player who is playing the card
     */
    attack(current_player: Player): void{

        // Get the attacked player
        const attacked_player:Player = this.active_players[this.next_player()];


        if(!this.resolve_nope_chain(current_player, attacked_player, CardType.Attack, AttackType.Attack)){
            // If the player is noped dont do anything
            return;
        }
        
        // If the attack is a success, give two turn to the next one
        this.turn = this.next_player();
        this.number_of_turns_left = 2;

    }

    /**
     * ASks a player to give a card to another player.
     * @param current_player - The player who is playing the card
     */
    favor(current_player: Player): void{

        // Get the player to steal from
        const player_to_steal: Player = this.active_players[this.callSystem.get_a_player_id(current_player)];

        if(player_to_steal.hand.length() === 0){
            // If the player has no cards to steal
            throw new Error('Player has no cards to steal');
        }

        if(player_to_steal === current_player){
            // If the player tries to steal from itself
            throw new Error('Player cannot steal from itself');
        }

        if(!this.resolve_nope_chain(current_player, player_to_steal, CardType.Favor, AttackType.Favor)){
            // If the player is noped dont do anything
            return;
        }
        
        // Get the card id to steal
        const card_id: number = this.callSystem.get_a_selected_card(player_to_steal);

        // Steal the card
        const card_to_steal: Card = player_to_steal.hand.pop_nth(card_id);

        // Notify the player who has been stolen of his new cards
        this.callSystem.notify_new_cards(player_to_steal);

        // Add the card to the current player
        current_player.hand.push(card_to_steal);

        // Notify the current player of his new cards
        this.callSystem.notify_new_cards(current_player);
        
    }

    /**
     * Play a wild card.
     * @param card_type - Wild card type to be played
     * @param current_player - The player who is playing the card
     * @returns 
     */
    play_wild_card(card_type: CardType, number_of_played_cards:number, current_player: Player): void{
        
        // Get the player to steal from
        const player_to_steal: Player = this.active_players[this.callSystem.get_a_player_id(current_player)];

        // Get the number of cards of the player to steal
        const length_cards: number = player_to_steal.hand.length();

        if(length_cards === 0){
            // If the player has no cards to steal
            throw new Error('Player has no cards to steal');
        }

        if(player_to_steal === current_player){
            // If the player tries to steal from itself
            throw new Error('Player cannot steal from itself');
        }

        if(!this.resolve_nope_chain(current_player, player_to_steal, CardType.Favor, AttackType.Favor)){
            // If the player is noped dont do anything
            return;
        }

        if (number_of_played_cards == 1){
            // If the player plays more than one wild card

            // Notify the player that the action is invalid
            throw new Error('Invalid action: Cannot play one wild card');
        } else if (number_of_played_cards === 2 ){
            // If the player plays two wild cards, steal a random card from the player
            this.steal_random_card(player_to_steal, current_player);
        } else if (number_of_played_cards === 3 ){
            // If the player plays three wild cards, steal one card by type
            this.steal_card_by_type(player_to_steal, current_player);
        } else {
            // If the player plays more than three wild cards
            throw new Error('Invalid action: Cannot play more than three wild cards');
        }
        

        // Notify the player who has been stolen of his new cards
        this.callSystem.notify_new_cards(player_to_steal);
    
        // Notify the current player of his new cards
        this.callSystem.notify_new_cards(current_player);
        
    }

    steal_random_card(player_to_steal: Player, current_player: Player): void{
        // Get the card id to steal
        const card_id: number = Math.floor(Math.random() * player_to_steal.hand.length());

        // Steal the card
        const card_to_steal: Card = player_to_steal.hand.pop_nth(card_id);

        // Add the card to the current player
        current_player.hand.push(card_to_steal);
    }

    steal_card_by_type(player_to_steal: Player, current_player: Player): void{

        // Get the card type to steal
        const card_type: CardType = this.callSystem.get_a_card_type(current_player);

        // Get the card id to steal
        const card_id: number = player_to_steal.hand.values.findIndex(card => card.type === card_type);

        if(card_id === -1){
            // If the player does not have the card to steal

            this.callSystem.broad_cast_failed_steal(current_player, player_to_steal, card_type);
        }

        // Steal the card
        const card_to_steal: Card = player_to_steal.hand.pop_nth(card_id);

        // Add the card to the current player
        current_player.hand.push(card_to_steal);
    }
}

