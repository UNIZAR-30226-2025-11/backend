import { GameObject } from "../models/GameObject.js";
import { GameRepository } from "../repositories/gameRepository.js";
import { LobbyManager } from "./lobbyManager.js";
import { Play } from "../models/Play.js";
import { CardArray } from "../models/CardArray.js";

export class GameManager {

    static async handlePlay(cards: CardArray, lobbyId: string, socketId: string): Promise<boolean>{
        
        const current_game: GameObject | undefined = LobbyManager.lobbiesGames.get(lobbyId);

        if (current_game === undefined){
            console.log("Game not found!");
            return false;
        }

        const playerIdInGame: number | undefined = await GameRepository.getPlayerIdInGame(socketId);

        if (playerIdInGame === undefined){
            console.log("You are not in the game!");
            return false;
        }
        
        const play: Play = new Play(playerIdInGame, cards);
        if (!await current_game.handlePlay(play))
        {
            console.log("Could not send the message!");
            return false;
        }

        return true;
    }

    static async disconnectPlayer(socketId: string, lobbyId: string): Promise<void>{
        const current_game: GameObject | undefined = LobbyManager.lobbiesGames.get(lobbyId);

        if (current_game === undefined){
            console.log("Game not found!");
            return;
        }

        const playerInGame: number | undefined = await GameRepository.getPlayerIdInGame(socketId);

        if (playerInGame === undefined){
            console.log("You are not in the game!");
            return;
        }

        current_game.disconnectPlayer(playerInGame);
    }

}