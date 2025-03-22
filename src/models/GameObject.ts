import { Player } from "./Player.js";
import { CommunicationGateway } from "../communication/interface/communicationGateway.js";
import { TURN_TIME_LIMIT } from "../constants/constants.js";
import { Deck } from "./Deck.js";
import { Play } from "./Play.js";
import { Card, CardType } from "./Card.js";
import { CardArray } from "./CardArray.js";
import logger from "../config/logger.js";
import { PausableTimeout } from "./PausableTimeout.js";

enum AttackType {
    Attack,
    Favor,
    Skip
}

export class GameObject {
    lobbyId: string;
    numberOfPlayers: number;
    players: Player[];
    deck: Deck;
    turn: number;
    turnTimeout: PausableTimeout;
    numberOfTurnsLeft: number;
    winnerUsername: string | undefined;
    callSystem: CommunicationGateway;
    leaderUsername : string;

    constructor(
        lobbyId:string,
        numberOfPlayers: number,
        playersUsernames: string[],
        leaderUsername: string, 
        comm: CommunicationGateway
    ) {

        logger.info(`[GAME] Creating game with ${numberOfPlayers} players`);
        
        this.lobbyId = lobbyId;
        this.callSystem = comm;

        this.deck = Deck.createStandardDeck(numberOfPlayers);

        this.players = [];
        for(let i = 0; i < numberOfPlayers; i++)
        {
            this.players.push(Player.createStandarPlayer(i, playersUsernames[i], this.deck));
        }
        this.deck.addBombs(numberOfPlayers-1);

        this.numberOfPlayers = numberOfPlayers;
        this.turn = 0;
        this.winnerUsername = undefined;
        this.numberOfTurnsLeft = 1;
        this.turnTimeout = new PausableTimeout(
            () => {
                const player: Player|undefined = this.players[this.turn];
                if(player === undefined){
                    logger.error(`[GAME] Player ${this.turn} not found`);
                    return;
                }
                this.handlePlayerLost(player);
            },
            TURN_TIME_LIMIT
        );
        this.leaderUsername = leaderUsername;

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
                    this.players, 
                    index,
                    this.players[this.turn].username, 
                    TURN_TIME_LIMIT, 
                )
            }
        });
    }

    // --------------------------------------------------------------------------------------
    // Class Methods 

    getWinnerId(): string | undefined {
        return this.winnerUsername;
    }

    getMaxPlayers(): number {
        return this.numberOfPlayers;
    }

    getIdByUsername(username: string): number | undefined {
        return this.players.findIndex(p => p.username === username);
    }

    getUsernameById(id: number): string | undefined {
        return this.players[id].username;
    }

    isInGame(username: string): boolean {
        return this.getIdByUsername(username) !== undefined
    }
    
    getPlayerByUsername(username: string): Player | undefined {
        const id: number | undefined = this.getIdByUsername(username);
        return id !== undefined ? this.players[id] : undefined;
    }

    /**
     * Start the turn timer
     */
    startTurnTimer(): void 
    {
        if (this.turnTimeout) {
            logger.verbose(`[GAME] Clearing previous timeout`);
            this.turnTimeout.clear();
        } 
        
        logger.debug(`[GAME] Starting turn timer for player ${this.turn}`);
        this.turnTimeout.start();
    }

    stopTurnTimer(): void {
        if (this.turnTimeout) {
            logger.verbose(`[GAME] Clearing previous timeout`);
            this.turnTimeout.clear();

        } 
    }

    async handleRequestInfo<T>(
        callback: (playerUsername: string, lobbyId: string) => Promise<T|undefined>,
        targetUser: string,
        lobbyId: string
    ) : Promise<T|undefined> {

        this.stopTurnTimer();
        const result: T | undefined = await callback(targetUser, lobbyId);

        if ( result === undefined) {
            logger.warn(`[GAME] Request failed. Player ${targetUser} did not respond so he loses.`);
            const player: Player|undefined = this.getPlayerByUsername(targetUser);
            if(player === undefined){
                logger.error(`[GAME] Player ${targetUser} not found`);
                return undefined;
            }
            this.handlePlayerLost(player);
        }

        this.startTurnTimer();
        return result;
    }

    isValidPlay(play:Play): boolean{
        
        const player: Player|undefined = this.getPlayerByUsername(play.username);

        if (player === undefined) {
            logger.warn(`[GAME] Invalid player username!`);
            return false;
        } 
        
        if (!player.active) {
            logger.warn(`[GAME] You have already lost!`);
            return false;
        } 
        
        if (!player.hand.containsAll(play.playedCards)) {
            logger.warn(`[GAME] You don't have the cards you are trying to play!`);
            return false;
        } 
        
        if (!play.isPlayable()){
            logger.warn(`[GAME] The cards are not playable`);
            return false;
        }

        return true;

    }


    // --------------------------------------------------------------------------------------
    // Starting and disconnect related methods

    disconnectPlayer(playerUsername: string): void {
        
        logger.info(`[GAME] Player ${playerUsername} has disconnected`);

        const player: Player|undefined = this.getPlayerByUsername(playerUsername);

        if(player === undefined){
            logger.error(`[GAME] Player ${playerUsername} not found`);
            return;
        }

        player.disconnected = true;

        this.callSystem.broadcastPlayerDisconnect(playerUsername);

    }
    
    // --------------------------------------------------------------------------------------
    // Game Logic Methods

    // --------------------------------
    // 1. Auxiliar Methods

    nextActivePlayer(): number {
        logger.verbose(`[GAME] Trying to find next active player from ${this.turn}`);
        let candidate: number = (this.turn + 1) % (this.numberOfPlayers);

        while(!this.players[candidate].active)
        {
            candidate = (candidate + 1) % (this.numberOfPlayers);
        }
        logger.verbose(`[GAME] Next active player is ${candidate}`);
        return candidate;
    }

    setNextTurn(): void {
        if(this.numberOfTurnsLeft > 1)
        {
            logger.verbose(`[GAME] Player ${this.turn} has ${this.numberOfTurnsLeft} turns left`);
            this.numberOfTurnsLeft--;

        } else {
            logger.verbose(`[GAME] Setting next turn from ${this.players[this.turn].username}`);
            this.turn = this.nextActivePlayer();
            this.numberOfTurnsLeft = 1;
            logger.verbose(`[GAME] Next turn is ${this.players[this.turn].username}`);
        }
        this.startTurnTimer();
        return;
    }

    forceNewTurn(turns: number): void {
        logger.info(`[GAME] Forcing new turn`);
        this.turn = this.nextActivePlayer();
        this.numberOfTurnsLeft = turns;
        this.startTurnTimer();
        return;
    }

    handlePlayerLost(player: Player): void {
        
        logger.info(`[GAME] Player ${player.username} has lost`);
        player.active = false;
        this.callSystem.broadcastPlayerLostAction(player.username);


        const winner: Player | undefined = this.getWinner();
        if(winner === undefined){
            logger.verbose(`[GAME] There is no winner yet`);
            if(player.id === this.turn){
                logger.verbose(`[GAME] Player ${player.username} is the current player, so we set the next turn`);
                this.setNextTurn();
            }
            logger.verbose(`[GAME] Player ${player.username} was not the current player, so we do nothing`);
            return;
        }

        logger.info(`[GAME] Winner is ${winner.username}`);
        this.callSystem.broadcastWinnerNotification(
            winner.username, 
            this.numberOfPlayers*100
        );

        this.winnerUsername = winner.username;

        this.stopTurnTimer();

    }

    getWinner(): Player | undefined {
        const activePlayers: Player[] = this.players.filter(p => p.active);
        return activePlayers.length === 1 ? activePlayers[0] : undefined;
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
    handleNewCard(newCard: Card, player: Player): void{

        logger.info(`[GAME] Handling new card for player ${player.username}`);
        logger.debug(`[GAME] New card: ${newCard}`);

        if (newCard.type === CardType.Bomb) {
            // If the card is a bomb

            // Check if the player has a deactivate card
            const indexDeactivate = player.hand.values.findIndex( card => card.type === CardType.Deactivate );

            if (indexDeactivate !== -1) {
                // If the player has a deactivate card
                logger.info(`[GAME] Player ${player.username} has defused the bomb using a deactivate card`);

                // Remove the deactivate card from the player
                player.hand.popNth(indexDeactivate); 
                
                // Add the bomb back to the deck
                this.deck.addWithShuffle(newCard);

                this.callSystem.broadcastBombDefusedAction(player.username)

                this.setNextTurn();

            } else {
                // If the player does not have a deactivate card
                logger.info(`[GAME] Player ${player.username} has exploded because he did not have a deactivate card`);

                // The player has lost
                this.handlePlayerLost(player);
            }
        } else{

            // Add the card to the player's hand
            player.hand.push(newCard);

            // Notify the player that he has gotten a new card
            this.callSystem.broadcastDrawCardAction(player.username)

            // Set the next turn
            this.setNextTurn();
        }

        this.callSystem.notifyDrewCard(newCard, player.username);
    }

    async playCards(playedCards: CardArray, player:Player): Promise<boolean>
    {  
        const card: Card = playedCards.values[0];;
        logger.info(`[GAME] Player ${player.username} is playing cards`);
        logger.debug(`[GAME] Cards played: ${playedCards}`);

        let actuallyPlayed: boolean = true;
        let cardsFuture: CardArray | undefined = undefined;
        if (card.type == CardType.SeeFuture){
            cardsFuture = this.seeFuture(player);
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
            actuallyPlayed = await this.favor(player);
        }
        else if (Card.isWild(card)){
            actuallyPlayed = await this.playWildCard(playedCards.length(), player);
        }
        else{
            logger.error(`[GAME] Card type not recognized`);
            return false;
        }

        // Remove the cards from the player's hand if they were actually played
        if(actuallyPlayed){
            player.hand.removeCards(playedCards);
        }

        if(cardsFuture !== undefined){
            this.callSystem.notifyFutureCards(cardsFuture, player.username);
        } else {
            this.callSystem.notifyOkPlayedCards(player.username);
        }

        return actuallyPlayed;

    }   

    // --------------------------------
    // 4. Play Cards

    /**
     * Shuffle the deck.
     */
    shuffle(currentPlayer: Player): void{

        logger.info(`[GAME] Player ${currentPlayer.username} is shuffling the deck`);

        // Randomly shuffle the deck
        this.deck.shuffle();
        this.callSystem.broadcastShuffleDeckAction(currentPlayer.username);
    }

    /**
     * Tries to skip the turn if the following player doesn't nope him.
     * @param currentPlayer - The player who is playing the card
     */
    skipTurn(currentPlayer: Player): void {
        
        logger.info(`[GAME] Player ${currentPlayer.username} is skipping the turn`);

        const followingPlayer = this.players[this.nextActivePlayer()];
        if(!this.resolveNopeChain(currentPlayer, followingPlayer, CardType.Skip, AttackType.Skip))
        {
            return;
        }

        logger.info(`[GAME] Player ${currentPlayer.username} has skipped the turn`);
        
        // If the skip is not noped, change the turn
        this.setNextTurn();
        
        // Notify the player he had skipped the turn
        this.callSystem.broadcastSkipTurnAction(currentPlayer.username);
    }

    /**
     * Shows the next 3 cards of the deck to the current player.
     * @param currentPlayer - The player who is playing the card
     */
    seeFuture(currentPlayer: Player): CardArray {

        logger.info(`[GAME] Player ${currentPlayer.username} is seeing the future`);
        
        // Get the next 3 cards
        const nextCards: CardArray = this.deck.peekN(3);

        this.callSystem.broadcastFutureAction(currentPlayer.username);

        return nextCards;
    }

    /**
     * Performs an attack to the next player.
     * @param currentPlayer - The player who is playing the card
     */
    attack(currentPlayer: Player): void {

        logger.info(`[GAME] Player ${currentPlayer.username} is attacking`);
        
        // Get the attacked player
        const attackedPlayer:Player = this.players[this.nextActivePlayer()];

        if(!this.resolveNopeChain(currentPlayer, attackedPlayer, CardType.Attack, AttackType.Attack)){
            return;
        }

        logger.info(`[GAME] Player ${currentPlayer.username} has attacked player ${attackedPlayer.id}`);

        // If the attack is a success, give two turn to the next one
        this.forceNewTurn(2);

        // Notify the player that the attack is successful
        this.callSystem.broadcastAttackAction(currentPlayer.username, attackedPlayer.username);
    }

    /**
     * Asks a player to give a card to another player.
     * @param currentPlayer - The player who is playing the card
     */
    async favor(currentPlayer: Player): Promise<boolean> {

        logger.info(`[GAME] Player ${currentPlayer.username} is asking for a favor`);

        // Get the player to steal from
        const playerUsername: string|undefined = await this.handleRequestInfo(
            this.callSystem.getAPlayerUsername,
            currentPlayer.username, 
            this.lobbyId
        );

        if(playerUsername === undefined){
            // If the player does not select a player
            logger.warn(`[GAME] Player has not selected a player to steal`);
            return false;
        }

        const playerToSteal: Player | undefined = this.getPlayerByUsername(playerUsername);

        if(playerToSteal === undefined){
            // If the player does not exist
            logger.warn(`[GAME] Player does not exist`);
            return false;
        }

        if(playerToSteal.hand.length() === 0){
            // If the player has no cards to steal
            logger.warn(`[GAME] Player has no cards to steal`);
            return false;
        }

        if(playerToSteal === currentPlayer){
            // If the player tries to steal from itself
            logger.warn(`[GAME] Player cannot steal from itself`);
            return false;
        }

        if(!this.resolveNopeChain(currentPlayer, playerToSteal, CardType.Favor, AttackType.Favor)){
            // If the player is noped dont do anything
            logger.info(`[GAME] Player has won the nope chain, favor canceled`);
            return true;
        }

        // Get a card from the player that is going to be stolen from
        const cardToGive: Card|undefined = await this.handleRequestInfo<Card>(
            this.callSystem.getACard,
            playerToSteal.username,
            this.lobbyId
        );

        if(cardToGive === undefined){
            // If the player does not select a card
            logger.warn(`[GAME] Player has not selected a card to give`);
            return false;
        }

        const cardIndex: number = playerToSteal.hand.hasCard(cardToGive.type);

        if(cardIndex === -1){
            // If the player does not have the card
            logger.warn(`[GAME] Player tried to give a card that does not have`);
            return false;
        }

        logger.info(`[GAME] Player ${playerToSteal.username} gave a card to player ${currentPlayer.username}`);
        // Steal the card
        playerToSteal.hand.popNth(cardIndex);

        // Add the card to the current player
        currentPlayer.hand.push(cardToGive);

        // Notify the attack
        this.callSystem.broadcastAttackAction(currentPlayer.username, playerToSteal.username);

        return true;
    }

    async playWildCard(numberOfPlayedCards:number, currentPlayer: Player): Promise<boolean>{

        logger.info(`[GAME] Player ${currentPlayer.username} is playing a wild card.`);

        const playerToStealUsername: string|undefined = await this.handleRequestInfo<string>(
            this.callSystem.getAPlayerUsername,
            currentPlayer.username,
            this.lobbyId
        );

        if(playerToStealUsername === undefined){
            return false;
        }

        const playerToSteal: Player | undefined = this.getPlayerByUsername(playerToStealUsername);

        if(playerToSteal === undefined){
            // If the player does not exist
            logger.warn(`[GAME] Player does not exist`);
            return false;
        }

        // Get the number of cards of the player to steal
        const numberOfCardsPlayerToSteal: number = playerToSteal.hand.length();

        if(numberOfCardsPlayerToSteal === 0){
            // If the player has no cards to steal
            logger.warn(`[GAME] Player has no cards to steal`);
            return false;
        }

        if(playerToSteal === currentPlayer){
            // If the player tries to steal from itself
            logger.warn(`[GAME] Player cannot steal from itself`);
            return false;
        }

        if(!this.resolveNopeChain(currentPlayer, playerToSteal, CardType.Favor, AttackType.Favor)){
            // If the player is noped notify attack failed
            logger.info(`[GAME] Player has won the nope chain, favor canceled`);
            return true;
        }

        logger.info(`[GAME] Player ${currentPlayer.username} is playing a wild card`);

        if (numberOfPlayedCards == 1){
            // If the player plays a single wild card
            logger.error(`[GAME] Cannot play a single wild card`);
            return false;
        } else if (numberOfPlayedCards === 2 ){
            // If the player plays two wild cards, steal a random card from the player
            this.stealRandomCard(playerToSteal, currentPlayer);
            return true;
        } else if (numberOfPlayedCards === 3 ){
            return await this.stealCardByType(playerToSteal, currentPlayer);
        } else {
            // If the player plays more than three wild cards
            logger.error(`[GAME] Cannot play more than three wild cards`);
            return false;
        }
    }


    stealRandomCard(playerToSteal: Player, currentPlayer: Player): void {

        logger.info(`[GAME] Player ${currentPlayer.username} is stealing a random card from player ${playerToSteal.id}`);
        
        // Get the card id to steal
        const cardId: number = Math.floor(Math.random() * playerToSteal.hand.length());

        // Steal the card
        const cardToSteal: Card = playerToSteal.hand.popNth(cardId);

        logger.info(`[GAME] Player ${currentPlayer.username} has stolen a card from player ${playerToSteal.id}`);
        
        // Add the card to the current player
        currentPlayer.hand.push(cardToSteal);
        this.callSystem.broadcastAttackAction(currentPlayer.username, playerToSteal.username);
    }

    async stealCardByType(playerToSteal: Player, currentPlayer: Player): Promise<boolean> {

        logger.info(`[GAME] Player ${currentPlayer.username} is stealing a card by type from player ${playerToSteal.id}`);

        // Get the card type to steal
        const cardType: CardType|undefined = await this.handleRequestInfo<CardType>(
            this.callSystem.getACardType,
            currentPlayer.username,
            this.lobbyId
        );
        
        if(cardType === undefined){
            return false;
        }

        // Get the card id to steal
        const cardId: number = playerToSteal.hand.hasCard(cardType);

        if(cardId === -1){
            logger.info(`[GAME] Player does not have the card you want to steal`);
            return true;
        }

        logger.info(`[GAME] Player ${currentPlayer.username} has stolen a card from player ${playerToSteal.id}`);

        // Steal the card
        const cardToSteal: Card = playerToSteal.hand.popNth(cardId);

        // Add the card to the current player
        currentPlayer.hand.push(cardToSteal);

        this.callSystem.broadcastAttackAction(currentPlayer.username, playerToSteal.username);

        return true;
    }

    // --------------------------------
    // 2. Main Functions 

    async handlePlay(play: Play): Promise<boolean>
    {
        const player: Player|undefined = this.getPlayerByUsername(play.username);

        if(player === undefined){
            logger.warn(`[GAME] Player ${play.username} not in game ${this.lobbyId}`);
            return false;
        }

        if (player.id != this.turn) {
            logger.warn(`[GAME] It is not your turn!`);
            return false;
        }

        if(play.playedCards.length() === 0){
            // If the player is drawing a card
            const newCard: Card = this.deck.drawLast();

            this.handleNewCard(newCard, player);

            this.communicateNewState();
            return true;
        }

        // If the player is playing a card
        const isValidPlay: boolean = this.isValidPlay(play);
        if(!isValidPlay){
            return false;
        }

        const canPlayCards:boolean = await this.playCards(play.playedCards, player);
        if(!canPlayCards){
            return false;
        }
        
        // Reset timer withouth changing turn
        this.startTurnTimer();
        this.communicateNewState();
        return true;
    }
    
}