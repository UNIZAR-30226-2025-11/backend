import { GameObject } from "../models/GameObject.js";
import { GameRepository } from "../repositories/gameRepository.js";
import { LobbyManager } from "./lobbyManager.js";
import { Play } from "../models/Play.js";
import { CardArray } from "../models/CardArray.js";
import logger from "../config/logger.js";

export class GameManager {

    /**
     * Handles the play of a player in a game
     * @param cards The cards played by the player
     * @param lobbyId The id of the lobby where the player is playing
     * @param username The username of the player
     * @returns True if the play was successful, false otherwise
     */
    static async handlePlay(cards: CardArray, lobbyId: string, username: string): Promise<boolean>{

        logger.info(`Handling play of ${username} in lobby ${lobbyId}`);
        logger.debug(`Cards played: %j`, cards);

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
    static async disconnectPlayer(username: string, lobbyId: string): Promise<void>{

        logger.info(`Disconnecting player ${username} from lobby ${lobbyId}`);

        const currentGame: GameObject | undefined = LobbyManager.lobbiesGames.get(lobbyId);

        if (currentGame === undefined){
            logger.error(`Game not found for lobby ${lobbyId}`);
            return;
        }

        const playerInGame: number | undefined = await GameRepository.getPlayerIdInGame(username);

        if (playerInGame === undefined){
            logger.error(`Player ${username} is not in the game!`);
            return;
        }

        currentGame.disconnectPlayer(playerInGame);

        return;
    }
    
    /**
     * Handles the end of a game
     * @param lobbyId The id of the lobby where the game ended
     * @returns 
     */
    static async handleWinner(username: string, coinsEarned: number, lobbyId: string): Promise<void>{

        logger.info(`Handling winner ${username} in lobby ${lobbyId}`);

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

        if (username !== winnerUsername){
            logger.warn(`Player ${username} is not the winner of the game!`);
            return;
        }

        await GameRepository.addCoinsToPlayer(username, coinsEarned);
        await GameRepository.addWinToPlayer(username);
        await GameRepository.addGamePlayedToLobby(lobbyId);

        LobbyManager.lobbiesGames.delete(lobbyId);

        return;
    }

}