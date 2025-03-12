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

        const player_id_in_game: number | undefined = await GameRepository.getPlayerIdInGame(socketId);

        if (player_id_in_game === undefined){
            console.log("You are not in the game!");
            return false;
        }
        
        const play: Play = new Play(player_id_in_game, cards);
        if (!await current_game.handlePlay(play))
        {
            console.log("Could not send the message!");
            return false;
        }

        return true;
    }

}