import { GameObject } from "../models/GameObject.js";
import { GameRepository } from "../repositories/gameRepository.js";
import { LobbyManager } from "./lobbyManager.js";
import { Play } from "../models/Play.js";
import { CardArray } from "../models/CardArray.js";
import logger from "../config/logger.js";
import eventBus from "../events/eventBus.js";
import { GameEvents } from "../events/gameEvents.js";
import { PlayerHistory } from "../models/PlayerHistory.js";

export class GameManager {

    static addMessage(msg: string, username: string, lobbyId: string): void {

        const currentGame: GameObject | undefined = LobbyManager.lobbiesGames.get(lobbyId);

        if (currentGame === undefined){
            logger.error(`Game not found for lobby ${lobbyId}`);
            return;
        }


        if (!currentGame.isInGame(username)){
            logger.warn(`Player ${username} not in lobby ${lobbyId}.`);
            return;
        }

        currentGame.postMsg(msg, username);
    }

    /**
     * Handles the play of a player in a game
     * @param cards The cards played by the player
     * @param lobbyId The id of the lobby where the player is playing
     * @param username The username of the player
     * @returns True if the play was successful, false otherwise
     */
    static async handlePlay(cards: CardArray, lobbyId: string, username: string): Promise<boolean>{

        logger.info(`Handling play of ${username} in lobby ${lobbyId}`);

        const currentGame: GameObject | undefined = LobbyManager.lobbiesGames.get(lobbyId);

        if (currentGame === undefined){
            logger.error(`Game not found for lobby ${lobbyId}`);
            return false;
        }

        const play: Play = new Play(username, cards);

        return await currentGame.handlePlay(play);
    }
    
    /**
     * Disconnects a player from a game
     * @param username The username of the player to be disconnected
     * @param lobbyId The id of the lobby where the player is playing
     * @returns 
     */
    static disconnectPlayer(username: string, lobbyId: string): void{

        logger.info(`Disconnecting player ${username} from lobby ${lobbyId}`);

        const currentGame: GameObject | undefined = LobbyManager.lobbiesGames.get(lobbyId);

        if (currentGame === undefined){
            logger.error(`Game not found for lobby ${lobbyId}`);
            return;
        }


        if (!currentGame.isInGame(username)){
            logger.error(`Player ${username} is not in the game!`);
            return;
        }

        currentGame.disconnectPlayer(username);

        return;
    }
    
    /**
     * Handles the end of a game
     * @param lobbyId The id of the lobby where the game ended
     * @returns 
     */
    static async handleWinner(lobbyId: string): Promise<void>{

        logger.info(`Handling winner in lobby ${lobbyId}`);

        const currentGame: GameObject | undefined = LobbyManager.lobbiesGames.get(lobbyId);

        if (currentGame === undefined){
            logger.error(`Game not found for lobby ${lobbyId}`);
            return;
        }

        const winnerUsername: string | undefined = currentGame.getWinnerId();

        if(winnerUsername === undefined){
            logger.warn(`No winner found for lobby ${lobbyId}`);
            return;
        }

        const allPlayersHistory: PlayerHistory[] = currentGame.getPlayersHistory();

        // Add game played to all players in the lobby
        await GameRepository.addGamePlayedToLobby(lobbyId);
        
        allPlayersHistory.forEach(async (player) => {
            
            await GameRepository.addCoinsToPlayer(player.username, player.coinsEarned);
            if (player.isWinner) {
                await GameRepository.addWinToPlayer(player.username);
                const streak: number = await GameRepository.addStreakWinToPlayer(player.username);
                const maxStreak: number = await GameRepository.getMaxStreakWin(player.username);
                if (streak > maxStreak) {
                    await GameRepository.setMaxStreakWin(player.username, streak);
                }
            } else {
                await GameRepository.removeStreakWinToPlayer(player.username);
            }
            await GameRepository.addHistoryToPlayer(player.username, player.lobbyId, player.isWinner, player.gameDate);
            await GameRepository.addTimePlayedToPlayer(player.username, player.timePlayed);
            await GameRepository.addTurnsPlayedToPlayer(player.username, player.turnsPlayed);
        });

        await LobbyManager.deleteLobby(lobbyId);

        return;
    }

}

eventBus.on(GameEvents.WINNER_SET, async (lobbyId: string) => {
    await GameManager.handleWinner(lobbyId);
});