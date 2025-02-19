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

    /**
     * Get if the card is a wild card
     * @param type - Type of the card
     * @returns True if it is a wild card, else False.
     */
    static is_wild(type: CardType): boolean {
        return type == CardType.RainbowCat || type == CardType.PotatoCat || type == CardType.TacoCat || type == CardType.HairyPotatoCat || type == CardType.Cattermelon || type == CardType.BeardCat;
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

    /**
     * Get if the card exist in a hand
     * @param type - Type of the card
     * @returns True if there is a card of this type, else False.
     */
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
    
        return new CardArray(this.cards.values.slice(-n)); 
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
    
    /**
     * Create a player
     * @param id - Id of the player
     * @param deck - Deck initial
     * @returns A player
     */
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
            
            // Get the played card
            const played_card_id:number = this.callSystem.get_played_cards();
            
            if(played_card_id == -1){ 
                // If the player does not play a card

                // Draw the last card from the deck
                const newCards: Card = this.deck.draw_last();

                // Handle the new card received
                this.handle_new_card(newCards, current_player);
                this.turn = (this.turn+1) % this.active_players.length;

            } else 
            {
                // If the player plays a card

                // Get the card from the player
                const card = current_player.hand.pop_nth(played_card_id);
                
                // Play the card
                this.play_card(card, current_player);   
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
    play_card(card: Card, current_player:Player): void {
        
        // Notify the players that the card has been used
        this.callSystem.broad_cast_card_used(current_player, card.type);

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
            this.play_wild_card(card.type, current_player);
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
     * Resolve the nope card
     * @param current_player - The player who is playing
     * @param attacked_player - The player who is attacked
     * @param card_type - Type of card
     * @param type_attack - Type of attack
     * @returns if has gone all ok whit the nope card.
     */
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

        const following_player = this.active_players[(this.turn + 1) % this.number_of_players];
        if(!this.resolve_nope_chain(current_player, following_player, CardType.Skip, AttackType.Skip))
        {
            return;
        }

        // Change the turn
        this.turn = (this.turn + 1) % this.number_of_players;
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
        this.turn = (this.turn + 1) % this.active_players.length;

        // Get the new current player
        current_player = this.active_players[this.turn];
            
        console.log(`Player ${current_player.id} turn`);
        console.log(`Hand: ${current_player.hand.toString()}`);
        let played_card_id:number = this.callSystem.get_played_cards();
        while (played_card_id !== -1){
            const card:Card = current_player.hand.pop_nth(played_card_id);
            
            this.play_card(card, current_player);   

            console.log(`Player ${current_player.id} turn`);
            console.log(`Hand: ${current_player.hand.toString()}`);
            played_card_id = this.callSystem.get_played_cards();
        }
        // Draw a cart
        const newCards: Card = this.deck.draw_last();
        this.handle_new_card(newCards, current_player);

    }

    /**
     * ASks a player to give a card to another player.
     * @param current_player - The player who is playing the card
     */
    favor(current_player: Player): void{

        // Get the player to steal from
        const player_to_steal: Player = this.active_players[this.callSystem.get_a_player_id()];

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
    play_wild_card_david(card_type: CardType, current_player: Player): void{
        
        // Get the player to steal from
        const player_to_steal: Player = this.active_players[this.callSystem.get_a_player_id()];

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
        
        // Chose a random value
        const randomIndex: number = Math.floor(Math.random() * length_cards);
    
        // Extract the card
        const newCard: Card = player_to_steal.hand.pop_nth(randomIndex);

        // Notify the player who has been stolen of his new cards
        this.callSystem.notify_new_cards(player_to_steal);
    
        // Agregar la carta robada a la mano del jugador actual
        current_player.hand.push(newCard);
    
        // Notify the current player of his new cards
        this.callSystem.notify_new_cards(current_player);
        
    }
    
    /**
     * Steal a card random from one player to another
     * @param current_player - The player who is going to steal a card
     */
    catch_one_card_random(current_player: Player):void{
        const chose_player: number =this.callSystem.get_played_favor(this.number_of_players);
        const length: number = this.active_players[chose_player].hand.length();

        if (length === 0) {
            console.log(`Player ${chose_player} has no cards to steal.`);
        } else {
            // Chose a random value
            const randomIndex = Math.floor(Math.random() * length);
        
            // extract the card
            const newCard: Card = this.active_players[chose_player].hand.pop_nth(randomIndex);
        
            // Agregar la carta robada a la mano del jugador actual
            current_player.hand.push(newCard);
        
            console.log(`Player ${current_player.id} stole a ${CardType[newCard.type]} card from Player ${chose_player}`);
        }
    }

    /**
     * Steal a card of a player
     * @param current_player - player who is going to steal
     */
    catch_an_specific_card(current_player: Player):void{
        const chose_player=this.callSystem.get_played_favor(this.number_of_players);
        const cardtype=this.callSystem.get_a_wild_card();

        const hand = this.active_players[chose_player].hand;

        if (hand.length() === 0) {
            console.log(`Player ${chose_player} has no cards to steal.`);
        } else {
            
            const index = hand.has_card(cardtype);

            if (index === -1) {
                console.log(`Player ${chose_player} does not have a ${CardType[cardtype]} card to steal.`);
            } else {
                const newCard: Card = this.active_players[chose_player].hand.pop_nth(index);

                current_player.hand.push(newCard);

                console.log(`Player ${current_player.id} stole a ${CardType[newCard.type]} card from Player ${chose_player}`);
            }
        }
    }

    /**
     * Play a wild card.
     * @param card_type - Wild card type to be played
     * @param current_player - The player who is playing the card
     * @returns 
     */
    play_wild_card(card_type: CardType, current_player: Player): void{

        let n_cards: number=1;
        let cont: boolean=true;

        while (cont && n_cards<4){
            this.callSystem.notify_current_hand(current_player);
            const newCard: number=this.callSystem.get_other_wild_card();
            if (newCard==-1){
                cont=false;
                if (n_cards<2){
                    console.log(`Yo don't have enough ${card_type} cards`);
                    current_player.hand.push(new Card(card_type));
                }
                else if (n_cards==2){
                    this.catch_one_card_random(current_player);
                }
                else{
                    this.catch_an_specific_card(current_player);
                }
                return;
            }

            const card : Card = current_player.hand.pop_nth(newCard);
            if (card_type === card.type){
                console.log(`Wild card matched: ${card.type}`);
                current_player.hand.pop_nth(newCard);
                n_cards++;
            }
        }

    }


}
