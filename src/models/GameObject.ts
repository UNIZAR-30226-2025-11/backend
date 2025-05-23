import { Player } from "./Player.js";
import { CommunicationGateway } from "../communication/interface/communicationGateway.js";
import { Deck } from "./Deck.js";
import { Play } from "./Play.js";
import { Card, CardType } from "./Card.js";
import { CardArray } from "./CardArray.js";
import logger from "../config/logger.js";
import { PausableTimeout } from "./PausableTimeout.js";
import { Message } from "./Message.js";
import eventBus from "../events/eventBus.js";
import { GameEvents } from "../events/gameEvents.js";
import { CARD_COUNTS, EXTRA_BOMBS, EXTRA_DEACTIVATES, TURN_TIME_LIMIT } from "../config.js";
import { ActionType, NopeType } from "./ActionType.js";
import { PlayerHistory } from "./PlayerHistory.js";
import { socketCommunicationGateway } from "../communication/implementations/socketCommunicationGateway.js";

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
    messages: Message[];
    lastPlayedCard: Card | undefined;

    gameDate: Date;
    turnsPlayed: number;
    gameEndDate: Date | undefined;

    constructor(
        lobbyId:string,
        numberOfPlayers: number,
        playersInfo: {username: string, avatar: string}[],
        leaderUsername: string, 
    ) {

        logger.info(`[GAME] Creating game with ${numberOfPlayers} players`);
        
        this.lobbyId = lobbyId;

        this.deck = new Deck();
        this.deck.addCards(CARD_COUNTS);
        this.deck.shuffle();
        this.lastPlayedCard = undefined;

        this.players = [];
        for(let i = 0; i < numberOfPlayers; i++)
        {
            this.players.push(Player.createStandarPlayer(i, playersInfo[i].username, playersInfo[i].avatar, this.deck));
        }

        // Create call system
        const comm: socketCommunicationGateway = new socketCommunicationGateway(lobbyId);

        this.players.forEach((player) => {
            comm.registerPlayer(player);
        });

        this.callSystem = comm;

        this.deck.addDeactivates(numberOfPlayers+EXTRA_DEACTIVATES);
        this.deck.addBombs(numberOfPlayers-1+EXTRA_BOMBS);

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

                logger.info(`[GAME] Player ${player.username} has timed out. By default, he loses`);
                this.handlePlayerLost(player);

                this.communicateNewState();
                
            },
            TURN_TIME_LIMIT
        );
        this.leaderUsername = leaderUsername;
        this.messages = [];


        this.gameDate = new Date();
        this.gameEndDate = undefined;
        this.turnsPlayed = 0;

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
                    this.deck.length(),
                    this.lastPlayedCard,
                    this.numberOfTurnsLeft
                )
            }
        });
    }

    // --------------------------------------------------------------------------------------
    // Mesasges methods

    postMsg(msg:string, username:string): void{
        this.messages.push(new Message(msg, username));

        this.callSystem.broadcastNewMessages(this.messages);
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

    getPlayersHistory(): PlayerHistory[] {

        if(this.winnerUsername === undefined || this.gameEndDate === undefined){
            logger.error(`[GAME] No winner yet`);
            return [];
        }

        const elapsedSeconds: number = Math.floor((this.gameEndDate.getTime() - this.gameDate.getTime()) / 1000);

        return this.players.map(player => {
            return new PlayerHistory(
                player.username,
                this.lobbyId,
                this.winnerUsername === player.username,
                this.winnerUsername === player.username? 100*this.numberOfPlayers : 50,
                this.gameDate,
                player.disconnected,
                elapsedSeconds,
                this.turnsPlayed
            );
        });
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
        
        logger.debug(`[GAME] Starting turn timer for player ${this.players[this.turn].username}`);
        this.turnTimeout.start();
    }

    stopTurnTimer(): void {
        if (this.turnTimeout) {
            logger.verbose(`[GAME] Clearing previous timeout`);
            this.turnTimeout.clear();

        } 
    }

    // --------------------------------------------------------------------------------------
    // Random Methods

    private randomPermutation(n: number): number[] {
        return [...Array(n).keys()].sort(() => Math.random() - 0.5);
    }

    private isThereAtackablePlayer(player: Player): boolean {
        return this.players.some(p => p !== player && p.hand.length() > 0 && p.active);
    }


    randomAtackablePlayer(player: Player): Player {
        const randomPermutation: number[] = this.randomPermutation(this.numberOfPlayers);

        for (let i = 0; i < this.numberOfPlayers; i++) {
            const id = randomPermutation[i];
            if(this.players[id] !== player && this.players[id].hand.length() > 0 && this.players[id].active){
                return this.players[id];
            }
        }

        logger.info(`[GAME] No player to steal from`);
        throw new Error(`No player to steal from!`);
    }

    randomCard(player: Player): {defaultCard: Card, cardIndex: number} {
        const randomPermutation: number[] = this.randomPermutation(player.hand.length());
        return {defaultCard: player.hand.values[randomPermutation[0]], cardIndex: randomPermutation[0]};
    }

    // --------------------------------------------------------------------------------------
    // Request Methods

    async requestNopeUsage(
        requesterPlayer: Player,
        nopeAction: NopeType
    ) : Promise<boolean> {

        const defaultAnswer: boolean = false;
        const getNopeUsageAux = (username: string, lobbyId: string) => {
            return this.callSystem.getNopeUsage(username, lobbyId, nopeAction);
        };
        const answer: boolean = await this.handleRequestInfo<boolean>(
            getNopeUsageAux.bind(this),
            requesterPlayer.username, 
            this.lobbyId,
            defaultAnswer,
        );

        return answer;
    }

    async requestCardType(
        requesterPlayer: Player
    ) : Promise<CardType> {

        const defaultType: CardType = CardType.Deactivate;

        const cardType: CardType = await this.handleRequestInfo<CardType>(
            this.callSystem.getACardType.bind(this.callSystem),
            requesterPlayer.username, 
            this.lobbyId,
            defaultType
        );

        return cardType;

    }

    async requestCard(
        requesterPlayer: Player
    ) : Promise<{cardToGive: Card, cardIndex: number}> {
        
        const {defaultCard: defaultCard, cardIndex: defaultIndex} = this.randomCard(requesterPlayer);
        
        const cardToSteal: Card = await this.handleRequestInfo<Card>(
            this.callSystem.getACard.bind(this.callSystem),
            requesterPlayer.username, 
            this.lobbyId,
            defaultCard
        );

        logger.verbose(`[GAME] Player ${requesterPlayer.username} wants to steal card ${cardToSteal}`);

        const cardIndexToSteal: number = requesterPlayer.hand.hasCard(cardToSteal);
        if(cardIndexToSteal === -1){
            logger.warn(`[GAME] Player does not have the card you want to steal. Returning default card ${defaultCard}`);
            return {cardToGive: defaultCard, cardIndex: defaultIndex};
        }

        return {cardToGive: cardToSteal, cardIndex: cardIndexToSteal};

    }

    async requestPlayer(
        requesterPlayer: Player
    ) : Promise<Player> {

        const defaultPlayer: Player = this.randomAtackablePlayer(requesterPlayer);

        const playerUsername: string = await this.handleRequestInfo<string>(
            this.callSystem.getAPlayerUsername.bind(this.callSystem),
            requesterPlayer.username, 
            this.lobbyId,
            defaultPlayer.username
        );

        const playerToSteal: Player | undefined = this.getPlayerByUsername(playerUsername);

        if(playerToSteal === undefined){
            // If the player does not exist
            logger.warn(`[GAME] Player does not exist. Returning default player ${defaultPlayer.username}`);
            return defaultPlayer;
        }

        if(playerToSteal.hand.length() === 0){
            // If the player has no cards to steal
            logger.warn(`[GAME] Player has no cards to steal. Returning default player ${defaultPlayer.username}`);
            return defaultPlayer;
        }

        if(playerToSteal === requesterPlayer){
            // If the player tries to steal from itself
            logger.warn(`[GAME] Player cannot steal from itself. Returning default player ${defaultPlayer.username}`);
            return defaultPlayer;
        }

        return playerToSteal;

    }

    async handleRequestInfo<T>(
        callback: (playerUsername: string, lobbyId: string) => Promise<T|undefined>,
        targetUser: string,
        lobbyId: string,
        defaultValue: T
    ) : Promise<T> {

        this.stopTurnTimer();
        const result: T | undefined = await callback(targetUser, lobbyId);

        if (result === undefined) {
            logger.warn(`[GAME] Request failed. Player ${targetUser} did not respond. Giving default value ${defaultValue}.`);
            return defaultValue;
        }

        this.startTurnTimer();
        return result;
    }

    // --------------------------------------------------------------------------------------


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

        if (Card.isAttack(play.playedCards.values[0]) && !this.isThereAtackablePlayer(player)) {
            logger.warn(`[GAME] There is no player to attack`);
            return false;
        }
        return true;

    }


    // --------------------------------------------------------------------------------------
    // Starting and disconnect related methods

    reconnectPlayer(playerUsername: string): void {
        logger.info(`[GAME] Player ${playerUsername} has reconnected`);

        const player: Player|undefined = this.getPlayerByUsername(playerUsername);

        if(player === undefined){
            logger.error(`[GAME] Player ${playerUsername} not found`);
            return;
        }

        player.disconnected = false;

        this.callSystem.broadcastPlayerReconnect(playerUsername);

        this.callSystem.notifyPlayerCanReconnect(playerUsername);

        this.communicateNewState();

        logger.info(`[GAME] Comunicating state to connected player.`);
        
        this.callSystem.notifyGameState(
            this.players, 
            player.id,
            this.players[this.turn].username, 
            this.turnTimeout.getRemainingTime(), 
            this.deck.length(),
            this.lastPlayedCard,
            this.numberOfTurnsLeft
        )

        this.callSystem.notifyMessages(
            playerUsername,
            this.messages
        );


    }

    disconnectPlayer(playerUsername: string): void {
        
        logger.info(`[GAME] Player ${playerUsername} has disconnected`);

        const player: Player|undefined = this.getPlayerByUsername(playerUsername);

        if(player === undefined){
            logger.error(`[GAME] Player ${playerUsername} not found`);
            return;
        }

        player.disconnected = true;

        this.callSystem.broadcastPlayerDisconnect(playerUsername);

        this.communicateNewState();

    }

    surrender(playerUsername: string): void {

        logger.info(`[GAME] Player ${playerUsername} has surrendered`);

        const player: Player|undefined = this.getPlayerByUsername(playerUsername);

        if(player === undefined){
            logger.error(`[GAME] Player ${playerUsername} not found`);
            return;
        }

        player.disconnected = true;

        this.callSystem.broadcastAction(ActionType.Surrender, player.username);

        if (player.id === this.turn) {
            logger.verbose(`[GAME] Player ${player.username} is the current player, so we set the next turn`);
            this.forceNewTurn(1);
            this.deck.removeBomb();
        }

        this.handlePlayerLost(player);

        this.communicateNewState();
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
            logger.verbose(`[GAME] Player ${this.turn} has ${--this.numberOfTurnsLeft} turns left`);
        } else {
            logger.verbose(`[GAME] Setting next turn from ${this.players[this.turn].username}`);
            this.turn = this.nextActivePlayer();
            this.numberOfTurnsLeft = 1;
            logger.verbose(`[GAME] Next turn is ${this.players[this.turn].username}`);
        }
        this.startTurnTimer();
        this.turnsPlayed++;
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

        this.winnerUsername = winner.username;

        this.gameEndDate = new Date();

        this.stopTurnTimer();

        const allPlayersHistory: PlayerHistory[] = this.getPlayersHistory();

        this.callSystem.broadcastWinnerNotification(
            winner.username, 
            allPlayersHistory,
        );

        eventBus.emit(GameEvents.WINNER_SET, this.lobbyId);
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
    async resolveNopeChain(currentPlayer:Player, attackedPlayer:Player, nopeAction:NopeType): Promise<boolean> {
            
        logger.info(`[GAME] Resolving nope chain`);
        let resolved: boolean = false;
        const players: Player[] = [currentPlayer, attackedPlayer];
        let playerToNope: number = 1;

        while(!resolved){
            // While the nope chain is not resolved

            // Ask the player if he wants to use the nope card
            const usedNope: boolean = await this.requestNopeUsage(players[playerToNope], nopeAction);
            if(usedNope){
                // If the player uses the nope card

                // Check if the player has a nope card
                const indexNope: number = players[playerToNope].hand.hasCardType(CardType.Nope);
    
                if(indexNope !== -1){
                    // If the player has a nope card

                    // Remove the nope card from the player
                    this.lastPlayedCard = players[playerToNope].hand.popNth(indexNope);

                    // Notify the rest of the players that the nope card has been used
                    this.callSystem.broadcastAction(ActionType.NopeUsed, players[playerToNope].username, players[(playerToNope + 1) % 2].username);
                    logger.verbose(`[GAME] Player ${players[playerToNope].username} has used a nope card`);
                    // Switch the player to nope
                    playerToNope = (playerToNope + 1) % 2;

                    this.communicateNewState();
                } else {
                    // If the player does not have a nope card
                    logger.warn(`[GAME] Player ${players[playerToNope].username} does not have a nope card and want to use it. By default, not use it.`);
                    
                    // Notify the rest of the players that the nope card has not been used
                    this.callSystem.broadcastAction(ActionType.NopeNotUsed, players[playerToNope].username, players[(playerToNope + 1) % 2].username);
                    
                    // The nope chain is resolved
                    resolved = true;
                }

            } else {
                // If the player does not use the nope card
                logger.verbose(`[GAME] Player ${players[playerToNope].username} does not want to use a nope card`);

                this.callSystem.broadcastAction(ActionType.NopeNotUsed, players[playerToNope].username, players[(playerToNope + 1) % 2].username);
                // The nope chain is resolved
                resolved = true;
            }  

            nopeAction = NopeType.Nope;

        }

        logger.verbose(`[GAME] Nope chain resolved. Winner is ${players[(playerToNope + 1)%2].username}`);
        // Return if the attack is successful
        return playerToNope === 1;
    }

    /**
     * Handle the reception of a new card.
     * @param newCard - The new card to handle
     * @param player - The player who receives the card
     */
    handleNewCard(newCard: Card, player: Player): void{

        logger.info(`[GAME] Handling new card for player ${player.username}`);
        logger.debug(`[GAME] New card: ${newCard}`);

        if (newCard.type == CardType.Bomb) {
            // If the card is a bomb

            // Check if the player has a deactivate card
            const indexDeactivate = player.hand.values.findIndex( card => card.type == CardType.Deactivate );

            if (indexDeactivate !== -1) {
                // If the player has a deactivate card
                logger.info(`[GAME] Player ${player.username} has defused the bomb using a deactivate card`);

                // Remove the deactivate card from the player
                this.lastPlayedCard = player.hand.popNth(indexDeactivate); 
                
                // Add the bomb back to the deck
                this.deck.addWithShuffle(newCard);

                this.callSystem.broadcastAction(ActionType.BombDefused, player.username)

                this.setNextTurn();

            } else {
                // If the player does not have a deactivate card
                logger.info(`[GAME] Player ${player.username} has exploded because he did not have a deactivate card`);
                
                // Notify the player that he has exploded
                this.callSystem.broadcastAction(ActionType.BombExploded, player.username);

                // The player has lost
                this.handlePlayerLost(player);
            }
        } else{

            // Add the card to the player's hand
            player.hand.push(newCard);

            // Notify the player that he has gotten a new card
            this.callSystem.broadcastAction(ActionType.CardReceived, player.username)

            // Set the next turn
            this.setNextTurn();
        }

        this.callSystem.notifyOkPlayedCardWithCardObtained(newCard, player.username);
    }

    async playCards(playedCards: CardArray, player:Player): Promise<boolean>
    {  
        const card: Card = playedCards.values[0];
        logger.debug(`[GAME] Cards played: ${playedCards}`);

        if (card.type == CardType.SeeFuture){
            this.seeFuture(player);
        }
        else if (card.type == CardType.Shuffle){
            this.shuffle(player);
        }
        else if (card.type == CardType.Skip){
            await this.skipTurn(player);
        }
        else if (card.type == CardType.Attack){
            await this.attack(player);
        } 
        else if (card.type == CardType.Favor){
            await this.favor(player);
        }
        else if (Card.isWild(card)){
            await this.playWildCard(playedCards.length(), player);
        }
        else{
            logger.error(`[GAME] Card type not recognized`);
            return false;
        }

        this.lastPlayedCard = player.hand.removeCards(playedCards);
        return true;
    }   

    // --------------------------------
    // 4. Play Cards

    /**
     * Shuffle the deck.
     */
    shuffle(currentPlayer: Player): void{

        logger.info(`[GAME] Player ${currentPlayer.username} is shuffling the deck`);
        this.callSystem.notifyOkPlayedCards(currentPlayer.username);

        // Randomly shuffle the deck
        this.deck.shuffle();
        this.callSystem.broadcastAction(ActionType.ShuffleDeck, currentPlayer.username);
    }

    /**
     * Tries to skip the turn if the following player doesn't nope him.
     * @param currentPlayer - The player who is playing the card
     */
    async skipTurn(currentPlayer: Player): Promise<void> {
        
        logger.info(`[GAME] Player ${currentPlayer.username} is skipping the turn`);

        const followingPlayer = this.players[this.nextActivePlayer()];

        // Notify the player he had skipped the turn
        this.callSystem.broadcastAction(ActionType.SkipTurn, currentPlayer.username, followingPlayer.username);

        if(!await this.resolveNopeChain(currentPlayer, followingPlayer, NopeType.SkipTurn))
        {
            this.callSystem.broadcastAction(ActionType.SkipTurnFailed, currentPlayer.username, followingPlayer.username);
            logger.info(`[GAME] Player ${currentPlayer.username} has been noped. Skip failed`);
            return;
        }

        logger.info(`[GAME] Player ${currentPlayer.username} has skipped the turn`);
        this.callSystem.notifyOkPlayedCards(currentPlayer.username);
        this.callSystem.broadcastAction(ActionType.SkipTurnSuccessful, currentPlayer.username, followingPlayer.username);
        
        // If the skip is not noped, change the turn
        this.setNextTurn();
    }

    /**
     * Shows the next 3 cards of the deck to the current player.
     * @param currentPlayer - The player who is playing the card
     */
    seeFuture(currentPlayer: Player): void {

        // Get the next 3 cards
        const nextCards: CardArray = this.deck.peekN(3);

        logger.info(`[GAME] Player ${currentPlayer.username} is seeing the future`);
        this.callSystem.broadcastAction(ActionType.FutureSeen, currentPlayer.username);

        this.callSystem.notifyFutureCards(nextCards, currentPlayer.username);

    }

    /**
     * Performs an attack to the next player.
     * @param currentPlayer - The player who is playing the card
     */
    async attack(currentPlayer: Player): Promise<void> {

        logger.info(`[GAME] Player ${currentPlayer.username} is attacking`);
        
        // Get the attacked player
        const attackedPlayer:Player = this.players[this.nextActivePlayer()];
        this.callSystem.broadcastAction(ActionType.Attack, currentPlayer.username, attackedPlayer.username);

        if(!await this.resolveNopeChain(currentPlayer, attackedPlayer, NopeType.Attack))
        {
            
            this.callSystem.broadcastAction(ActionType.AttackFailed, currentPlayer.username, attackedPlayer.username);
            logger.info(`[GAME] Player ${currentPlayer.username} has been noped. Attack failed`);
            return;
        }

        logger.info(`[GAME] Player ${currentPlayer.username} has attacked player ${attackedPlayer.id}`);

        this.callSystem.broadcastAction(ActionType.AttackSuccessful, currentPlayer.username, attackedPlayer.username);

        // If the attack is a success, give two turn to the next one
        this.forceNewTurn(2);

        this.callSystem.notifyOkPlayedCards(currentPlayer.username);

    }

    /**
     * Asks a player to give a card to another player.
     * @param currentPlayer - The player who is playing the card
     */
    async favor(currentPlayer: Player): Promise<void> {

        logger.info(`[GAME] Player ${currentPlayer.username} is asking for a favor`);

        // Get the player to steal from

        const playerToSteal: Player = await this.requestPlayer(currentPlayer);
        this.callSystem.broadcastAction(ActionType.FavorAttack, currentPlayer.username, playerToSteal.username);

        if(!await this.resolveNopeChain(currentPlayer, playerToSteal, NopeType.FavorAttack))
        {
            // If the player is noped dont do anything
            this.callSystem.broadcastAction(ActionType.FavorAttackFailed, currentPlayer.username, playerToSteal.username);
            
            logger.info(`[GAME] Player has won the nope chain, favor canceled`);
            return;
        }

        const { cardToGive, cardIndex }: {cardToGive:Card, cardIndex:number} = await this.requestCard(playerToSteal);

        logger.info(`[GAME] Player ${playerToSteal.username} gave a card to player ${currentPlayer.username}`);

        this.callSystem.notifyOkPlayedCardWithCardObtained(cardToGive, currentPlayer.username);

        // Steal the card
        playerToSteal.hand.popNth(cardIndex);

        // Add the card to the current player
        currentPlayer.hand.push(cardToGive);

        // Notify the attack
        this.callSystem.broadcastAction(ActionType.FavorAttackSuccessful, currentPlayer.username, playerToSteal.username);

        return;
    }

    async playWildCard(numberOfPlayedCards:number, currentPlayer: Player): Promise<void>{

        logger.info(`[GAME] Player ${currentPlayer.username} is playing a wild card.`);

        const playerToSteal: Player = await this.requestPlayer(currentPlayer);

        logger.info(`[GAME] Player ${currentPlayer.username} is playing a wild card`);

        if (numberOfPlayedCards <= 1 || numberOfPlayedCards > 3){
            // If the player plays a single wild card
            logger.error(`[GAME] Cannot play this number of wild cards.`);
            return;
        } 

        const actionType: ActionType = numberOfPlayedCards === 2 ? ActionType.TwoWildCardAttack : ActionType.ThreeWildCardAttack;
        const nopeAction: NopeType = numberOfPlayedCards === 2 ? NopeType.TwoWildCard : NopeType.ThreeWildCard;

        this.callSystem.broadcastAction(actionType, currentPlayer.username, playerToSteal.username);

        if(!await this.resolveNopeChain(currentPlayer, playerToSteal, nopeAction)){
            // If the player is noped notify attack failed
            this.callSystem.broadcastAction(actionType, currentPlayer.username, playerToSteal.username);

            logger.info(`[GAME] Player has won the nope chain. Two wild cards attack canceled`);
            return;
        }
        
        if (numberOfPlayedCards === 2 ){
            // If the player plays two wild cards, steal a random card from the player
            this.stealRandomCard(playerToSteal, currentPlayer);
        } else{
            // If the player plays three wild cards, steal a card by type from the player
            await this.stealCardByType(playerToSteal, currentPlayer);
        }

        return;
    }


    stealRandomCard(playerToSteal: Player, currentPlayer: Player): void {

        logger.info(`[GAME] Player ${currentPlayer.username} is stealing a random card from player ${playerToSteal.id}`);
        
        // Get the card id to steal
        const cardId: number = Math.floor(Math.random() * playerToSteal.hand.length());

        // Steal the card
        const cardToSteal: Card = playerToSteal.hand.popNth(cardId);

        logger.debug(`[GAME] Player ${currentPlayer.username} has stolen the card ${cardToSteal.toString()} from player ${playerToSteal.id}`);
        this.callSystem.notifyOkPlayedCardWithCardObtained(cardToSteal, currentPlayer.username);
        
        // Notify the attack
        this.callSystem.broadcastAction(ActionType.TwoWildCardAttackSuccessful, currentPlayer.username, playerToSteal.username);
        
        // Add the card to the current player
        currentPlayer.hand.push(cardToSteal);
    }

    async stealCardByType(playerToSteal: Player, currentPlayer: Player): Promise<void> {

        logger.info(`[GAME] Player ${currentPlayer.username} is stealing a card by type from player ${playerToSteal.id}`);

        // Get the card type to steal
        const cardType: CardType = await this.requestCardType(currentPlayer);

        const cardIndex: number = playerToSteal.hand.hasCardType(cardType);

        if(cardIndex === -1){
            logger.info(`[GAME] Player does not have the card you want to steal`);
            this.callSystem.notifyOkPlayedCards(currentPlayer.username);
            return;
        }

        logger.info(`[GAME] Player ${currentPlayer.username} has stolen a card of type ${CardType[cardType]} from player ${playerToSteal.id}`);

        // Steal the card
        const cardToSteal: Card = playerToSteal.hand.popNth(cardIndex);
        this.callSystem.notifyOkPlayedCardWithCardObtained(cardToSteal, currentPlayer.username);
        
        // Notify the attack
        this.callSystem.broadcastAction(ActionType.ThreeWildCardAttackSuccessful, currentPlayer.username, playerToSteal.username);

        // Add the card to the current player
        currentPlayer.hand.push(cardToSteal);

        return;
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

        await this.playCards(play.playedCards, player);

        // Reset timer withouth changing turn
        this.startTurnTimer();
        this.communicateNewState();
        return true;
    }
    
}