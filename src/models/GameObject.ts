import { Player } from "./Player.js";
import { CommunicationHandler } from "../services/communication/communicationHandler.js";
import { TURN_TIME_LIMIT } from "../constants/constants.js";
import { Deck } from "./Deck.js";
import { Play } from "./Play.js";
import { 
    BackendStateUpdateJSON, 
    BackendWinnerJSON, 
    BackendGamePlayedCardsResponseJSON 
} from "../api/socketAPI.js";
import { Card, CardType } from "./Card.js";
import { CardArray } from "./CardArray.js";

enum AttackType {
    Attack,
    Favor,
    Skip
}

export class GameObject {
    gameId: string;
    numberOfPlayers: number;
    players: Player[];
    deck: Deck;
    turn: number;
    turnTimeout: NodeJS.Timeout | null;
    numberOfTurnsLeft: number;
    hasWinner: boolean;
    callSystem: CommunicationHandler;
    gameStarted: boolean;
    leaderId : number;

    constructor(
        id:string,
        numberOfPlayers: number, 
        leaderId: number, 
        comm: CommunicationHandler
    ) {
        this.gameId = id;
        this.callSystem = comm;

        this.deck = Deck.createStandardDeck(numberOfPlayers);

        this.players = [];
        for(let i = 0; i < numberOfPlayers; i++)
        {
            this.players.push(Player.createStandarPlayer(i, this.deck));
        }
        this.deck.add_bombs(numberOfPlayers-1);

        this.numberOfPlayers = numberOfPlayers;
        this.turn = 0;
        this.hasWinner = false;
        this.gameStarted = false;
        this.numberOfTurnsLeft = 1;
        this.turnTimeout = null;
        this.leaderId = leaderId;

    }

    // --------------------------------------------------------------------------------------
    // JSON Responses

    createStateUpdateResponse(idPlayer: number) : BackendStateUpdateJSON {
        const response: BackendStateUpdateJSON = {
            error: false,
            errorMsg: "",
            playerCards: this.players[idPlayer].hand.toJSON(),
            players: this.players.map(p => p.toJSONHidden()),
            turn: this.turn,
            timeOut: TURN_TIME_LIMIT,
            playerId: idPlayer
        };
        
        return response;
    }

    createErrorPlayedCardsResponse(msg: string): BackendGamePlayedCardsResponseJSON {
        const response: BackendGamePlayedCardsResponseJSON = {
            error: true,
            errorMsg: msg,
            cardsSeeFuture: "",
            hasShuffled: false,
            skipTurn: false,
            hasWonAttack: false,
            hasStolenRandomCard: false,
            hasStolenCardByType: false
        };
        return response;
    }
    
    createErrorResponse(msg: string): BackendGamePlayedCardsResponseJSON {
        const response: BackendGamePlayedCardsResponseJSON = {
            error: true,
            errorMsg: msg,
            cardsSeeFuture: "",
            hasShuffled: false,
            skipTurn: false,
            hasWonAttack: false,
            hasStolenRandomCard: false,
            hasStolenCardByType: false
        };
        return response;
    }

    createSeeFutureResponse(cards: CardArray): BackendGamePlayedCardsResponseJSON {
        const response: BackendGamePlayedCardsResponseJSON = {
            error: false,
            errorMsg: "",
            cardsSeeFuture: cards.toJSON(),
            hasShuffled: false,
            skipTurn: false,
            hasWonAttack: false,
            hasStolenRandomCard: false,
            hasStolenCardByType: false
        };
        return response;

    }

    createStealRandomCardResponse(playerId: number): BackendGamePlayedCardsResponseJSON {
        const response: BackendGamePlayedCardsResponseJSON = {
            error: false,
            errorMsg: "",
            cardsSeeFuture: "",
            hasShuffled: false,
            skipTurn: false,
            hasWonAttack: false,
            hasStolenRandomCard: true,
            hasStolenCardByType: false
        };
        return response;
    }

    createStealCardByTypeResponse(playerId: number): BackendGamePlayedCardsResponseJSON {
        const response: BackendGamePlayedCardsResponseJSON = {
            error: false,
            errorMsg: "",
            cardsSeeFuture: "",
            hasShuffled: false,
            skipTurn: false,
            hasWonAttack: false,
            hasStolenRandomCard: false,
            hasStolenCardByType: true
        };
        return response;
    }

    createNextTurnResponse(): BackendGamePlayedCardsResponseJSON {
        const response: BackendGamePlayedCardsResponseJSON = {
            error: false,
            errorMsg: "",
            cardsSeeFuture: "",
            hasShuffled: false,
            skipTurn: true,
            hasWonAttack: false,
            hasStolenRandomCard: false,
            hasStolenCardByType: false
        };
        return response;
    }

    createWinnerResponse(winnerId: number): BackendWinnerJSON{
        const response: BackendWinnerJSON = {
            error: false,
            errorMsg: "",
            userId: winnerId,
            coinsEarned: 100* this.numberOfPlayers
        };
        return response
    }

    createShuffleResponse(): BackendGamePlayedCardsResponseJSON {
        const response: BackendGamePlayedCardsResponseJSON = {
            error: false,
            errorMsg: "",
            cardsSeeFuture: "",
            hasShuffled: true,
            skipTurn: false,
            hasWonAttack: false,
            hasStolenRandomCard: false,
            hasStolenCardByType: false
        };
        return response;
    }

    createAttackWonResponse(): BackendGamePlayedCardsResponseJSON {
        const response: BackendGamePlayedCardsResponseJSON = {
            error: false,
            errorMsg: "",
            cardsSeeFuture: "",
            hasShuffled: false,
            skipTurn: false,
            hasWonAttack: true,
            hasStolenRandomCard: false,
            hasStolenCardByType: false
        };
        return response;
    }

    communicateNewState(): void {
        console.log("Communicating new state of the game");
        this.players.forEach((player, index) => {
            if(!player.disconnected)
            {
                this.callSystem.sendGameJSON(this.createStateUpdateResponse(index), index);
            }
        });
    }

    // --------------------------------------------------------------------------------------
    // Class Methods 

    toJSON() {
        return null;
    }

    static fromJSON(){
        throw new Error("Method not implemented.");
    }

    isStarted(): boolean {
        return this.gameStarted;
    }

    isLeader(player_id: number): boolean {
        return this.leaderId === player_id;
    }

    getMaxPlayers(): number {
        return this.numberOfPlayers;
    }


    /**
     * Start the turn timer
     */
    startTurnTimer(): void 
    {
        if (this.turnTimeout)
        {
            clearTimeout(this.turnTimeout);
        } 
    
        const cb = () => {
            this.players[this.turn].active = false;
            this.checkWinner();
            this.nextActivePlayer();
            this.startTurnTimer(); // Restart timer for next player
        }
        
        this.turnTimeout = setTimeout(cb, TURN_TIME_LIMIT);
    }

    isValidPlay(play:Play): boolean{
        
        let msg = "";
        if (0 > play.idPlayer || play.idPlayer >= this.numberOfPlayers) {
            msg = "Invalid player id!";
        } else if (play.idPlayer != this.turn) {
            msg = "Not your turn!";
        } else if (!this.gameStarted) {
            msg = "Game not started!";
        } else if (!this.players[play.idPlayer].active) {
            msg = "You have already lost!";
        } else if (!this.players[play.idPlayer].hand.containsAll(play.playedCards)) {
            msg = "You don't have the cards you are trying to play!";
        } else if (!play.isPlayable()){
            msg = "The cards are not playable";
        }

        if (msg != "") {
            this.callSystem.sendGamePlayedCardsResponseJSON(this.createErrorResponse(msg), play.idPlayer);
            return false;
        } else {
            return true;
        }

    }


    // --------------------------------------------------------------------------------------
    // Starting and disconnect related stuff

    startGame(playerId: number): boolean {
        const player:Player = this.players[playerId];

        if(player.id !== this.leaderId)
        {
            console.log("Cannot start game. You are not the leader of the lobby!");
            return false;
        }
        
        if(this.gameStarted)
        {
            console.log("Cannot start game. Game already started!");
            return false;
        }

        this.gameStarted = true;

        console.log("Game started!");

        // Comunicate the new state of the game
        this.communicateNewState();

        // Start the timeout for the player turn
        this.startTurnTimer(); 

        return true;
    }

    disconnectPlayer(playerId:number): void {
        // FIXME
        const player: Player|undefined = this.players[playerId];

        console.log("Player", player.id, "disconnected!");
        player.disconnected = true;
    }
    
    // --------------------------------------------------------------------------------------
    // Game Logic Methods

    // --------------------------------
    // 1. Auxiliar Methods

    nextActivePlayer(): number {
        let candidate: number = (this.turn + 1) % (this.numberOfPlayers);
        while(!this.players[this.turn].active)
        {
            candidate = (this.turn + 1) % (this.numberOfPlayers);
        }
        return candidate;
    }

    setNextTurn(): void {
        if(this.numberOfTurnsLeft > 1)
        {
            this.numberOfTurnsLeft--;

        } else {
            this.turn = this.nextActivePlayer();
            this.numberOfTurnsLeft = 1;
        }
        return;
    }

    checkWinner(): Player | undefined {
        let activePlayers: Player[] = this.players.filter(p => p.active);
        
        if (activePlayers.length !== 1) {
            return undefined;
        }

        this.callSystem.notifyWinner(this.createWinnerResponse(activePlayers[0].id));

        this.gameStarted = false;
        this.hasWinner = true;

        return activePlayers[0];
    }

    /**
     * Function that resolves the Nope chain of cards.
     * @param currentPlayer - Current player who is playing the card
     * @param attackedPlayer - Player who is being attacked
     * @param cardType - Card type that is being played
     * @param typeAttack - Type of attack that is being played
     * @returns True if the attack is successful, false otherwise
     */
    resolveNopeChain(currentPlayer:Player, attackedPlayer:Player, cardType:CardType, typeAttack:AttackType): boolean {

        // TODO: Everything
        
        // // Notify the attack
        // this.callSystem.notify_attack(attackedPlayer, typeAttack);
            
        // let resolved: boolean = false;
        // const players = [currentPlayer, attackedPlayer];
        // let player_to_nope = 1;

        // while(!resolved){
        //     // While the nope chain is not resolved

        //     // Check if the player has a nope card
        //     const index_nope = players[player_to_nope].hand.has_card(CardType.Nope);
            
        //     if(index_nope !== -1){
        //         // If the player has a nope card

        //         // Ask the player if he wants to use the nope card
        //         const used_nope = this.callSystem.get_nope_card(players[player_to_nope]);
        //         if(used_nope){
        //             // If the player uses the nope card

        //             // Remove the nope card from the player
        //             players[player_to_nope].hand.pop_nth(index_nope);

        //             // Notify the rest of the players that the nope card has been used
        //             this.callSystem.broad_cast_card_used(players[player_to_nope], CardType.Nope, 1);

        //             // Switch the player to nope
        //             player_to_nope = (player_to_nope + 1) % 2;
        //         } else {
        //             // If the player does not use the nope card

        //             // The nope chain is resolved
        //             resolved = true;
        //         }
        //     } else {
        //         // If the player does not have a nope card

        //         // The nope chain is resolved
        //         resolved = true;
        //     }
        // }

        // // Notify the result of the attack
        // this.callSystem.notify_attack_result(attackedPlayer, currentPlayer, typeAttack, player_to_nope===1);
        
        // // Return if the attack is successful
        // return player_to_nope === 1;
        return true;
    
    }

    /**
     * Handle the reception of a new card.
     * @param newCard - The new card to handle
     * @param player - The player who receives the card
     */
    handleNewCard(newCard: Card, playerId: number){

        // TODO: Notify in some way that the player has gotten a bomb, or a new card
        const player: Player = this.players[playerId];

        if (newCard.type === CardType.Bomb) {
            // If the card is a bomb

            // Check if the player has a deactivate card
            const indexDeactivate = player.hand.values.findIndex( card => card.type === CardType.Deactivate );

            if (indexDeactivate !== -1) {
                // If the player has a deactivate card
                
                console.log("You have exploted but you have a deactivate card");
                // Remove the deactivate card from the player
                player.hand.pop_nth(indexDeactivate); 
                
                // Add the bomb back to the deck
                this.deck.add_with_shuffle(newCard);
                

            } else {
                
                console.log("You have lost!");
                // Remove the player from the active players
                this.players[player.id].active = false;
            }
        } else{
            // If the card is not a bomb

            // Add the card to the player's hand
            player.hand.push(newCard);
        }
    }

    async playCards(play: Play): Promise<void>
    {  

        const card: Card = play.playedCards.values[0];
        const player: Player = this.players[play.idPlayer];

        if (card.type == CardType.SeeFuture){
            this.seeFuture(player);
        }
        else if (card.type == CardType.Shuffle){
            this.shuffle();
        }
        else if (card.type == CardType.Skip){
            this.skipTurn(player);
        }
        else if (card.type == CardType.Attack){
            this.attack(player);
        } 
        else if (card.type == CardType.Favor){
            this.favor(player);
        }
        else if (Card.isWild(card)){
            await this.playWildCard(play.playedCards.length(), player);
        }
        else{
            console.log("Card type not recognized. Not supposed to get here.");
            this.callSystem.sendGamePlayedCardsResponseJSON(
                this.createErrorPlayedCardsResponse(`Card type not recognized`),
                player.id
            );
            return;
        }

        this.players[play.idPlayer].hand.removeCards(play.playedCards);
    }   

    // --------------------------------
    // 4. Play Cards

    /**
     * Shuffle the deck.
     */
    shuffle(): void{

        // Randomly shuffle the deck
        this.deck.shuffle();

        // Notify the player that the deck has been shuffled
        this.callSystem.sendGamePlayedCardsResponseJSON(
            this.createShuffleResponse(),
            this.turn
        );

        // TODO: Notify the players that the deck has been shuffled. Important: We need to create another msg
        // because it is not good to notify via the played cards cuz the other players have not played any card.
    }

    /**
     * Tries to skip the turn if the following player doesn't nope him.
     * @param currentPlayer - The player who is playing the card
     */
    skipTurn(currentPlayer:Player): void {
        
        const following_player = this.players[this.nextActivePlayer()];
        if(!this.resolveNopeChain(currentPlayer, following_player, CardType.Skip, AttackType.Skip))
        {
            return;
        }

        // If the skip is not noped, change the turn
        this.setNextTurn();


        // Notify the player he had skipped the turn
        this.callSystem.sendGamePlayedCardsResponseJSON(
            this.createNextTurnResponse(),
            currentPlayer.id
        );

        // TODO: Notify the players that the turn has been skipped. Important: We need to create another msg
        // because it is not good to notify via the played cards cuz the other players have not played any card.
    }

    /**
     * Shows the next 3 cards of the deck to the current player.
     * @param current_player - The player who is playing the card
     */
    seeFuture(current_player: Player): void {
        
        // Get the next 3 cards
        const nextCards: CardArray = this.deck.peek_n(3);

        // Notify the player of the next 3 cards
        this.callSystem.sendGamePlayedCardsResponseJSON(
            this.createSeeFutureResponse(nextCards), 
            current_player.id
        );

        // TODO: Notify the player of the next 3 cards. Important: We need to create another msg
        // because it is not good to notify via the played cards cuz the other players have not played any card.
    }

    /**
     * Performs an attack to the next player.
     * @param current_player - The player who is playing the card
     */
    attack(current_player: Player): void {
        
        // Get the attacked player
        const attacked_player:Player = this.players[this.nextActivePlayer()];

        if(!this.resolveNopeChain(current_player, attacked_player, CardType.Attack, AttackType.Attack)){
            // If the player is noped, notify the player that the attack is canceled

            this.callSystem.sendGamePlayedCardsResponseJSON(
                this.createErrorPlayedCardsResponse(`Player ${attacked_player.id} has won the nope chain, attack canceled`),
                current_player.id
            );

            return;
        }

        // If the attack is a success, give two turn to the next one
        this.turn = this.nextActivePlayer();
        this.numberOfTurnsLeft = 2;

        // Notify the player that the attack is successful
        this.callSystem.sendGamePlayedCardsResponseJSON(
            this.createAttackWonResponse(),
            current_player.id
        );
        
        // TODO: Notify the attack is successful to the attacked player. Important: We need to create another msg
        // because it is not good to notify via the played cards cuz the other players have not played any card.
    }

    /**
     * Asks a player to give a card to another player.
     * @param currentPlayer - The player who is playing the card
     */
    async favor(currentPlayer: Player): Promise<void> {

        // Get the player to steal from
        const playerID: number|undefined = await this.callSystem.getAPlayerId(currentPlayer.id, this.gameId);

        if(playerID === undefined){
            // If the player does not select a player

            this.callSystem.sendGamePlayedCardsResponseJSON(
                this.createErrorPlayedCardsResponse(`You have not selected any player to steal`),
                currentPlayer.id
            );

            return;
        }

        const playerToSteal: Player = this.players[playerID];

        if(playerToSteal.hand.length() === 0){
            // If the player has no cards to steal

            this.callSystem.sendGamePlayedCardsResponseJSON(
                this.createErrorPlayedCardsResponse(`Player ${playerID} has no cards to steal`),
                currentPlayer.id
            );

            return;
        }

        if(playerToSteal === currentPlayer){
            // If the player tries to steal from itself

            this.callSystem.sendGamePlayedCardsResponseJSON(
                this.createErrorPlayedCardsResponse(`Player cannot steal from itself`),
                currentPlayer.id
            );

            return;
        }

        if(!this.resolveNopeChain(currentPlayer, playerToSteal, CardType.Favor, AttackType.Favor)){
            // If the player is noped dont do anything
            this.callSystem.sendGamePlayedCardsResponseJSON(
                this.createErrorPlayedCardsResponse(`Player ${playerID} has won the nope chain, favor canceled`),
                currentPlayer.id
            );

            return;
        }

        const cardToGive: Card|undefined = await this.callSystem.getACard(currentPlayer.id, this.gameId);

        if(cardToGive === undefined){
            // If the player does not select a card
            this.callSystem.sendGamePlayedCardsResponseJSON(
                this.createErrorPlayedCardsResponse(`You have not selected any card to give`),
                currentPlayer.id
            );
            return;
        }

        const cardIndex: number = playerToSteal.hand.has_card(cardToGive.type);

        if(cardIndex === -1){
            // If the player does not have the card
            this.callSystem.sendGamePlayedCardsResponseJSON(
                this.createErrorPlayedCardsResponse(`You dont have the card you want to give`),
                currentPlayer.id
            );
            return;
        }

        // Steal the card
        playerToSteal.hand.pop_nth(cardIndex);

        // Add the card to the current player
        currentPlayer.hand.push(cardToGive);

    }

    /**
     * Play a wild card.
     * @param card_type - Wild card type to be played
     * @param currentPlayer - The player who is playing the card
     * @returns 
     */
    async playWildCard(numberOfPlayedCards:number, currentPlayer: Player): Promise<void>{

        const playerToStealId: number|undefined = await this.callSystem.getAPlayerId(currentPlayer.id, this.gameId);
        if(playerToStealId === undefined){
            // If the player does not select a player
            console.log("Player has not selected a player to steal");
            this.callSystem.sendGamePlayedCardsResponseJSON(
                this.createErrorPlayedCardsResponse(`You have not selected any player to steal`),
                currentPlayer.id
            );
            return;
        }

        const playerToSteal: Player = this.players[playerToStealId];

        // Get the number of cards of the player to steal
        const numberOfCardsPlayerToSteal: number = playerToSteal.hand.length();

        if(numberOfCardsPlayerToSteal === 0){
            // If the player has no cards to steal
            console.log("Player has no cards to steal");
            this.callSystem.sendGamePlayedCardsResponseJSON(
                this.createErrorPlayedCardsResponse(`Player ${playerToStealId} has no cards to steal`),
                currentPlayer.id
            );
            return;
        }

        if(playerToSteal === currentPlayer){
            // If the player tries to steal from itself
            console.log("Player cannot steal from itself");
            this.callSystem.sendGamePlayedCardsResponseJSON(
                this.createErrorPlayedCardsResponse(`Player cannot steal from itself`),
                currentPlayer.id
            );
            return;
        }

        if(!this.resolveNopeChain(currentPlayer, playerToSteal, CardType.Favor, AttackType.Favor)){
            // If the player is noped notify attack failed
            console.log("Player has won the nope chain, favor canceled");
            this.callSystem.sendGamePlayedCardsResponseJSON(
                this.createErrorPlayedCardsResponse(`Player ${playerToStealId} has won the nope chain, favor canceled`),
                currentPlayer.id
            );

            return;
        }

        console.log("Played cards: ", numberOfPlayedCards);

        if (numberOfPlayedCards == 1){

            console.log('Not supposed to get here')
            // If the player plays more than one wild card
            this.callSystem.sendGamePlayedCardsResponseJSON(
                this.createErrorPlayedCardsResponse(`You cannot play just one wild card`),
                currentPlayer.id
            );
            return;
        } else if (numberOfPlayedCards === 2 ){
            // If the player plays two wild cards, steal a random card from the player
            console.log('Stealing random card')
            this.stealRandomCard(playerToSteal, currentPlayer);
            this.callSystem.sendGamePlayedCardsResponseJSON(
                this.createStealRandomCardResponse(playerToStealId),
                currentPlayer.id
            );
            return;
        } else if (numberOfPlayedCards === 3 ){
            // If the player plays three wild cards, steal one card by type
            console.log('Stealing card by type')
            await this.stealCardByType(playerToSteal, currentPlayer);
            this.callSystem.sendGamePlayedCardsResponseJSON(
                this.createStealCardByTypeResponse(playerToStealId),
                currentPlayer.id
            );
            return;
        } else {
            // If the player plays more than three wild cards
            console.log('Not supposed to get here')
            this.callSystem.sendGamePlayedCardsResponseJSON(
                this.createErrorPlayedCardsResponse(`You cannot play more than three wild cards`),
                currentPlayer.id
            );
            return;
        }
    }


    stealRandomCard(playerToSteal: Player, currentPlayer: Player): void {

        // Get the card id to steal
        const cardId: number = Math.floor(Math.random() * playerToSteal.hand.length());

        // Steal the card
        const cardToSteal: Card = playerToSteal.hand.pop_nth(cardId);

        // Add the card to the current player
        currentPlayer.hand.push(cardToSteal);
    }

    async stealCardByType(playerToSteal: Player, currentPlayer: Player): Promise<void> {

        // Get the card type to steal
        const cardType: CardType|undefined  = await this.callSystem.getACardType(currentPlayer.id, this.gameId);

        if(cardType === undefined){
            // If the player does not select a card type

            this.callSystem.sendGamePlayedCardsResponseJSON(
                this.createErrorPlayedCardsResponse(`You have not selected any card type to steal`),
                currentPlayer.id
            );

            return;
        }

        // Get the card id to steal
        const cardId: number = playerToSteal.hand.has_card(cardType);

        if(cardId === -1){
            // If the player does not have the card

            this.callSystem.sendGamePlayedCardsResponseJSON(
                this.createErrorPlayedCardsResponse(`Player ${playerToSteal.id} does not have the card you want to steal`),
                currentPlayer.id
            );

            return;
        }

        // Steal the card
        const cardToSteal: Card = playerToSteal.hand.pop_nth(cardId);

        // Add the card to the current player
        currentPlayer.hand.push(cardToSteal);
    }

    // --------------------------------
    // 2. Main Functions 

    async handlePlay(play: Play): Promise<boolean>
    {

        if(play.playedCards.length() === 0){

            const newCard: Card = this.deck.draw_last();

            this.handleNewCard(newCard, play.idPlayer);
            this.setNextTurn();
            this.checkWinner();
            this.startTurnTimer();
            
        } else 
        {
            if(!this.isValidPlay(play)){
                console.log("Not valid action!")
                return false;
            }
            await this.playCards(play);
        }
        this.communicateNewState();
        return true;
    }

    
}