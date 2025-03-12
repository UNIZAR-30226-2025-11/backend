import { Socket } from "socket.io";
import { GameManager } from "../services/gameManager.js";
import { 
    FrontendGamePlayedCardsJSON,
    BackendGamePlayedCardsResponseJSON,
} from "../api/socketAPI.js";
import { Card, CardType } from "../models/Card.js";
import { CardArray } from "../models/CardArray.js";
import { handleError } from "../constants/constants.js";

export const setupGameHandlers = (socket: Socket) => {

    socket.on("game-played-cards", async (playedCardsJSON: FrontendGamePlayedCardsJSON) => {
        
        const lobbyId = playedCardsJSON.lobbyId;

        if (lobbyId === undefined || lobbyId === "") {
            const response: BackendGamePlayedCardsResponseJSON = 
            {
                error: true,
                errorMsg: "Not lobby id provided!",
                cardsSeeFuture: "",
                cardReceived: "",
            };

            socket.emit("game-played-cards", response)
            return;
        }

        handleError(playedCardsJSON.error, playedCardsJSON.errorMsg)
        

        const cardsPlayedString: string[] = JSON.parse(playedCardsJSON.playedCards);
        const cardsPlayed: Card[] = cardsPlayedString.map((cardString) => new Card(CardType[cardString as keyof typeof CardType]));
        const cardArray: CardArray = new CardArray(cardsPlayed);

        if(!await GameManager.handlePlay(cardArray, lobbyId, socket.id))
        {
            const response: BackendGamePlayedCardsResponseJSON = 
            {
                error: true,
                errorMsg: "Could not send the message!",
                cardsSeeFuture: "",
                cardReceived: "",
            };

            socket.emit("game-played-cards", response)
            return;
        }
    
    });

};