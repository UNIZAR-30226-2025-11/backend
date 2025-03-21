import { Player } from "./Player.js";
import { CommunicationGateway } from "../communication/interface/communicationGateway.js";
import { TURN_TIME_LIMIT } from "../constants/constants.js";
import { Deck } from "./Deck.js";
import { Play } from "./Play.js";
import { Card, CardType } from "./Card.js";
import { CardArray } from "./CardArray.js";
import logger from "../config/logger.js";

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
    winner: number | undefined;
    callSystem: CommunicationGateway;
    leaderId : number;

    constructor(
        id:string,
        numberOfPlayers: number, 
        leaderId: number, 
        comm: CommunicationGateway
    ) {

        logger.info(`[GAME] Creating game with ${numberOfPlayers} players`);
        
        this.gameId = id;
        this.callSystem = comm;

        this.deck = Deck.createStandardDeck(numberOfPlayers);

        this.players = [];
        for(let i = 0; i < numberOfPlayers; i++)
        {
            this.players.push(Player.createStandarPlayer(i, this.deck));
        }
        this.deck.addBombs(numberOfPlayers-1);

        this.numberOfPlayers = numberOfPlayers;
        this.turn = 0;
        this.winner = undefined;
        this.numberOfTurnsLeft = 1;
        this.turnTimeout = null;
        this.leaderId = leaderId;

        this.callSystem.broadcastStartGame();
        this.communicateNewState();

        // Start the timeout for the player turn
        this.startTurnTimer(); 
    }

    // --------------------------------------------------------------------------------------
    // JSON Responses

    communicateNewState(): void {
        logger.info(`[GAME] Communicating new state to all players`);
        this.players.forEach((player, index) => {
            if(!player.disconnected)
            {
                this.callSystem.notifyGameState(
                    player.hand, 
                    this.players, 
                    this.turn, 
                    TURN_TIME_LIMIT, 
                    index
                )
            }
        });
    }

    // --------------------------------------------------------------------------------------
    // Class Methods 

    getWinnerId(): number | undefined {
        return this.winner;
    }

    isLeader(playerId: number): boolean {
        return this.leaderId === playerId;
    }

    getMaxPlayers(): number {
        return this.numberOfPlayers;
    }

    /**
     * Start the turn timer
     */
    startTurnTimer(): void 
    {
        if (this.turnTimeout) {
            logger.debug(`[GAME] Clearing previous timeout`);
            clearTimeout(this.turnTimeout);
        } 
    
        const cb = () => {
            logger.debug(`[GAME] Player ${this.turn} has run out of time!`);
            this.players[this.turn].active = false;
            if(this.getWinner() === undefined){
                // If there is no winner, start the next turn
                this.setNextTurn();
                this.startTurnTimer();
            }
            
        }
        
        logger.debug(`[GAME] Starting turn timer for player ${this.turn}`);
        this.turnTimeout = setTimeout(cb, TURN_TIME_LIMIT);
    }

    isValidPlay(play:Play): boolean{
        
        let msg = "";
        if (0 > play.idPlayer || play.idPlayer >= this.numberOfPlayers) {
            msg = "Invalid player id!";
        } else if (play.idPlayer != this.turn) {
            msg = "Not your turn!";
        } else if (!this.players[play.idPlayer].active) {
            msg = "You have already lost!";
        } else if (!this.players[play.idPlayer].hand.containsAll(play.playedCards)) {
            msg = "You don't have the cards you are trying to play!";
        } else if (!play.isPlayable()){
            msg = "The cards are not playable";
        }

        if (msg != "") {
            this.callSystem.notifyErrorPlayedCards(msg, play.idPlayer);
            return false;
        } else {
            return true;
        }

    }


    // --------------------------------------------------------------------------------------
    // Starting and disconnect related methods

    disconnectPlayer(playerId:number): void {
        
        logger.info(`[GAME] Player ${playerId} has disconnected`);

        const player: Player|undefined = this.players[playerId];

        if(player === undefined){
            logger.error(`[GAME] Player ${playerId} not found`);
            return;
        }

        player.disconnected = true;

        this.callSystem.broadcastPlayerDisconnect(playerId);

        if(this.turn === playerId){
            logger.info(`[GAME] Player ${playerId} has disconnected while holding turn. Passing turn`);
            
            this.setNextTurn();
            this.communicateNewState();
        }
    }
    
    // --------------------------------------------------------------------------------------
    // Game Logic Methods

    // --------------------------------
    // 1. Auxiliar Methods

    nextActivePlayer(): number {
        logger.debug(`[GAME] Trying to find next active player`);
        let candidate: number = (this.turn + 1) % (this.numberOfPlayers);
        while(!this.players[candidate].active)
        {
            candidate = (candidate + 1) % (this.numberOfPlayers);
        }
        logger.debug(`[GAME] Next active player is ${candidate}`);
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

    getWinner(): Player | undefined {
        logger.info(`[GAME] Checking for winner`);
        const activePlayers: Player[] = this.players.filter(p => p.active);
        
        logger.debug(`[GAME] Active players: ${activePlayers.length}`);
        if (activePlayers.length !== 1) {
            return undefined;
        }

        logger.info(`[GAME] Player ${activePlayers[0].id} has won!`);

        this.callSystem.broadcastWinnerNotification(activePlayers[0].id, this.numberOfPlayers*100, this.gameId);

        this.winner = activePlayers[0].id;

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
    resolveNopeChain(_currentPlayer:Player, _attackedPlayer:Player, _cardType:CardType, _typeAttack:AttackType): boolean {

        logger.warn(`[GAME] Nope chain not implemented yet. Returning true`);
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

        logger.info(`[GAME] Handling new card for player ${playerId}`);

        const player: Player = this.players[playerId];

        if (newCard.type === CardType.Bomb) {
            // If the card is a bomb

            // Check if the player has a deactivate card
            const indexDeactivate = player.hand.values.findIndex( card => card.type === CardType.Deactivate );

            if (indexDeactivate !== -1) {
                // If the player has a deactivate card
                logger.info(`[GAME] Player ${playerId} has defused the bomb using a deactivate card`);

                // Remove the deactivate card from the player
                player.hand.popNth(indexDeactivate); 
                
                // Add the bomb back to the deck
                this.deck.addWithShuffle(newCard);

                this.callSystem.broadcastBombDefusedAction(playerId)

            } else {
                // If the player does not have a deactivate card
                logger.info(`[GAME] Player ${playerId} has exploded because he did not have a deactivate card`);

                // Remove the player from the active players
                this.players[player.id].active = false;

                // Notify all players that the player has lost
                this.callSystem.broadcastPlayerLostAction(player.id);
            }
        } else{
            // If the card is not a bomb
            logger.info(`[GAME] Player ${playerId} has drawn a card`);

            // Add the card to the player's hand
            player.hand.push(newCard);

            // Notify the player that he has gotten a new card
            this.callSystem.broadcastDrawCardAction(player.id)
        }

        this.callSystem.notifyDrewCard(newCard, playerId);
    }

    async playCards(play: Play): Promise<void>
    {  

        logger.info(`[GAME] Player ${play.idPlayer} is playing cards`);
        logger.debug(`[GAME] Cards played: ${play.playedCards.values}`);

        const card: Card = play.playedCards.values[0];
        const player: Player = this.players[play.idPlayer];

        if (card.type == CardType.SeeFuture){
            this.seeFuture(player);
        }
        else if (card.type == CardType.Shuffle){
            this.shuffle(player);
        }
        else if (card.type == CardType.Skip){
            this.skipTurn(player);
        }
        else if (card.type == CardType.Attack){
            this.attack(player);
        } 
        else if (card.type == CardType.Favor){
            await this.favor(player);
        }
        else if (Card.isWild(card)){
            await this.playWildCard(play.playedCards.length(), player);
        }
        else{
            logger.error(`[GAME] Card type not recognized`);
            this.callSystem.notifyErrorPlayedCards(`Card type not recognized`, player.id);
            return;
        }

        this.players[play.idPlayer].hand.removeCards(play.playedCards);
        this.callSystem.notifyOkPlayedCards(play.idPlayer);
    }   

    // --------------------------------
    // 4. Play Cards

    /**
     * Shuffle the deck.
     */
    shuffle(currentPlayer: Player): void{

        logger.info(`[GAME] Player ${currentPlayer.id} is shuffling the deck`);

        // Randomly shuffle the deck
        this.deck.shuffle();
        this.callSystem.broadcastShuffleDeckAction(currentPlayer.id);
    }

    /**
     * Tries to skip the turn if the following player doesn't nope him.
     * @param currentPlayer - The player who is playing the card
     */
    skipTurn(currentPlayer: Player): void {
        
        logger.info(`[GAME] Player ${currentPlayer.id} is skipping the turn`);

        const followingPlayer = this.players[this.nextActivePlayer()];
        if(!this.resolveNopeChain(currentPlayer, followingPlayer, CardType.Skip, AttackType.Skip))
        {
            return;
        }

        logger.info(`[GAME] Player ${currentPlayer.id} has skipped the turn`);
        
        // If the skip is not noped, change the turn
        this.setNextTurn();
        // Notify the player he had skipped the turn
        this.callSystem.broadcastSkipTurnAction(currentPlayer.id);
    }

    /**
     * Shows the next 3 cards of the deck to the current player.
     * @param currentPlayer - The player who is playing the card
     */
    seeFuture(currentPlayer: Player): void {

        logger.info(`[GAME] Player ${currentPlayer.id} is seeing the future`);
        
        // Get the next 3 cards
        const nextCards: CardArray = this.deck.peekN(3);

        // Notify the player the next 3 cards
        this.callSystem.notifyFutureCards(nextCards, currentPlayer.id);

        this.callSystem.broadcastFutureAction(currentPlayer.id);
    }

    /**
     * Performs an attack to the next player.
     * @param currentPlayer - The player who is playing the card
     */
    attack(currentPlayer: Player): void {

        logger.info(`[GAME] Player ${currentPlayer.id} is attacking`);
        
        // Get the attacked player
        const attackedPlayer:Player = this.players[this.nextActivePlayer()];

        if(!this.resolveNopeChain(currentPlayer, attackedPlayer, CardType.Attack, AttackType.Attack)){
            return;
        }

        logger.info(`[GAME] Player ${currentPlayer.id} has attacked player ${attackedPlayer.id}`);

        // If the attack is a success, give two turn to the next one
        this.turn = this.nextActivePlayer();
        this.numberOfTurnsLeft = 2;

        // Notify the player that the attack is successful
        this.callSystem.broadcastAttackAction(currentPlayer.id, attackedPlayer.id);
    }

    /**
     * Asks a player to give a card to another player.
     * @param currentPlayer - The player who is playing the card
     */
    async favor(currentPlayer: Player): Promise<void> {

        logger.info(`[GAME] Player ${currentPlayer.id} is asking for a favor`);

        // Get the player to steal from
        const playerID: number|undefined = await this.callSystem.getAPlayerId(currentPlayer.id, this.gameId);

        if(playerID === undefined){
            // If the player does not select a player
            logger.warn(`[GAME] Player has not selected a player to steal`);
            return;
        }

        const playerToSteal: Player = this.players[playerID];

        if(playerToSteal.hand.length() === 0){
            // If the player has no cards to steal
            logger.warn(`[GAME] Player has no cards to steal`);
            return;
        }

        if(playerToSteal === currentPlayer){
            // If the player tries to steal from itself
            logger.warn(`[GAME] Player cannot steal from itself`);
            return;
        }

        if(!this.resolveNopeChain(currentPlayer, playerToSteal, CardType.Favor, AttackType.Favor)){
            // If the player is noped dont do anything
            logger.info(`[GAME] Player has won the nope chain, favor canceled`);
            return;
        }

        const cardToGive: Card|undefined = await this.callSystem.getACard(currentPlayer.id, this.gameId);

        if(cardToGive === undefined){
            // If the player does not select a card
            logger.warn(`[GAME] Player has not selected a card to give`);
            return;
        }

        const cardIndex: number = playerToSteal.hand.hasCard(cardToGive.type);

        if(cardIndex === -1){
            // If the player does not have the card
            logger.info(`[GAME] Player does not have the card you want to steal`);
            return;
        }

        logger.info(`[GAME] Player ${currentPlayer.id} has stolen a card from player ${playerToSteal.id}`);
        // Steal the card
        playerToSteal.hand.popNth(cardIndex);

        // Add the card to the current player
        currentPlayer.hand.push(cardToGive);

        // Notify the attack
        this.callSystem.broadcastAttackAction(currentPlayer.id, playerToSteal.id);

    }

    async playWildCard(numberOfPlayedCards:number, currentPlayer: Player): Promise<void>{

        const playerToStealId: number|undefined = await this.callSystem.getAPlayerId(currentPlayer.id, this.gameId);
        if(playerToStealId === undefined){
            // If the player does not select a player
            logger.warn(`[GAME] Player has not selected a player to steal`);
            return;
        }

        const playerToSteal: Player = this.players[playerToStealId];

        // Get the number of cards of the player to steal
        const numberOfCardsPlayerToSteal: number = playerToSteal.hand.length();

        if(numberOfCardsPlayerToSteal === 0){
            // If the player has no cards to steal
            logger.warn(`[GAME] Player has no cards to steal`);
            return;
        }

        if(playerToSteal === currentPlayer){
            // If the player tries to steal from itself
            logger.warn(`[GAME] Player cannot steal from itself`);
            return;
        }

        if(!this.resolveNopeChain(currentPlayer, playerToSteal, CardType.Favor, AttackType.Favor)){
            // If the player is noped notify attack failed
            logger.info(`[GAME] Player has won the nope chain, favor canceled`);
            return;
        }

        logger.info(`[GAME] Player ${currentPlayer.id} is playing a wild card`);

        if (numberOfPlayedCards == 1){
            // If the player plays a single wild card
            logger.error(`[GAME] Cannot play a single wild card`);
            return;
        } else if (numberOfPlayedCards === 2 ){
            // If the player plays two wild cards, steal a random card from the player
            this.stealRandomCard(playerToSteal, currentPlayer);
            return;
        } else if (numberOfPlayedCards === 3 ){
            await this.stealCardByType(playerToSteal, currentPlayer);
            return;
        } else {
            // If the player plays more than three wild cards
            logger.error(`[GAME] Cannot play more than three wild cards`);
            return;
        }
    }


    stealRandomCard(playerToSteal: Player, currentPlayer: Player): void {

        logger.info(`[GAME] Player ${currentPlayer.id} is stealing a random card from player ${playerToSteal.id}`);
        
        // Get the card id to steal
        const cardId: number = Math.floor(Math.random() * playerToSteal.hand.length());

        // Steal the card
        const cardToSteal: Card = playerToSteal.hand.popNth(cardId);

        logger.info(`[GAME] Player ${currentPlayer.id} has stolen a card from player ${playerToSteal.id}`);
        
        // Add the card to the current player
        currentPlayer.hand.push(cardToSteal);
        this.callSystem.broadcastAttackAction(currentPlayer.id, playerToSteal.id);
    }

    async stealCardByType(playerToSteal: Player, currentPlayer: Player): Promise<void> {

        logger.info(`[GAME] Player ${currentPlayer.id} is stealing a card by type from player ${playerToSteal.id}`);

        // Get the card type to steal
        const cardType: CardType|undefined  = await this.callSystem.getACardType(currentPlayer.id, this.gameId);

        if(cardType === undefined){
            logger.warn(`[GAME] Player has not selected a card to steal`);
            return;
        }

        // Get the card id to steal
        const cardId: number = playerToSteal.hand.hasCard(cardType);

        if(cardId === -1){
            logger.info(`[GAME] Player does not have the card you want to steal`);
            return;
        }

        logger.info(`[GAME] Player ${currentPlayer.id} has stolen a card from player ${playerToSteal.id}`);

        // Steal the card
        const cardToSteal: Card = playerToSteal.hand.popNth(cardId);

        // Add the card to the current player
        currentPlayer.hand.push(cardToSteal);

        this.callSystem.broadcastAttackAction(currentPlayer.id, playerToSteal.id);
    }

    // --------------------------------
    // 2. Main Functions 

    async handlePlay(play: Play): Promise<boolean>
    {
        logger.info(`[GAME] Handling play`);

        if(play.playedCards.length() === 0){
            // If the player is drawing a card
            logger.info(`[GAME] Player ${play.idPlayer} is drawing a card`);

            const newCard: Card = this.deck.drawLast();

            this.handleNewCard(newCard, play.idPlayer);
            if(this.getWinner() === undefined){
                this.startTurnTimer();
                this.setNextTurn();
            }
        } else 
        {
            // If the player is playing a card

            logger.info(`[GAME] Player ${play.idPlayer} is playing a card`);
            logger.debug(`[GAME] Cards played: ${play.playedCards.values}`);

            if(!this.isValidPlay(play)){
                logger.warn(`[GAME] Invalid play`);
                return false;
            }
            await this.playCards(play);
        }
        this.communicateNewState();
        return true;
    }

    
}