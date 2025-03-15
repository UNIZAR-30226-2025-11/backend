import { GameObject } from "../models/GameObject.js";
import { GameRepository } from "../repositories/gameRepository.js";
import { LobbyManager } from "./lobbyManager.js";
import { Play } from "../models/Play.js";
import { CardArray } from "../models/CardArray.js";

export class GameManager {

    static async handlePlay(cards: CardArray, lobbyId: string, username: string): Promise<boolean>{
        
        const currentGame: GameObject | undefined = LobbyManager.lobbiesGames.get(lobbyId);

        if (currentGame === undefined){
            console.log("Game not found!");
            return false;
        }

        const playerIdInGame: number | undefined = await GameRepository.getPlayerIdInGame(username);

        if (playerIdInGame === undefined){
            console.log("You are not in the game!");
            return false;
        }
        
        const play: Play = new Play(playerIdInGame, cards);
        if (!await currentGame.handlePlay(play))
        {
            console.log("Could not send the message!");
            return false;
        }

        return true;
    }

    static async disconnectPlayer(username: string, lobbyId: string): Promise<void>{
        const currentGame: GameObject | undefined = LobbyManager.lobbiesGames.get(lobbyId);

        if (currentGame === undefined){
            console.log("Game not found!");
            return;
        }

        const playerInGame: number | undefined = await GameRepository.getPlayerIdInGame(username);

        if (playerInGame === undefined){
            console.log("You are not in the game!");
            return;
        }

        currentGame.disconnectPlayer(playerInGame);
    }

}