import { Socket } from "socket.io";
import { GameManager } from "../managers/gameManager.js";
import { 
    FrontendGamePlayedCardsJSON,
    BackendGamePlayedCardsResponseJSON,
    FrontendWinnerResponseJSON
} from "../api/socketAPI.js";
import { Card, CardType } from "../models/Card.js";
import { CardArray } from "../models/CardArray.js";
import { handleError } from "../constants/constants.js";
import logger from "../config/logger.js";

export const setupGameHandlers = (socket: Socket) => {

    socket.on("game-played-cards", async (playedCardsJSON: FrontendGamePlayedCardsJSON) => {
        
        logger.info(`User "${socket.data.user.username}" sent "game-played-cards" message`);
        logger.debug(`Received "game-played-cards":\t%j`, playedCardsJSON);

        handleError(playedCardsJSON.error, playedCardsJSON.errorMsg);

        const lobbyId: string = playedCardsJSON.lobbyId;
        const username: string = socket.data.user.username;

        if (lobbyId === undefined || lobbyId === "") {

            logger.warn(`Not lobby id provided!`);

            const response: BackendGamePlayedCardsResponseJSON = 
            {
                error: true,
                errorMsg: "Not lobby id provided!",
                cardsSeeFuture: "",
                cardReceived: "",
            };

            logger.debug(`Sending response "game-played-cards":\t%j`, response);
            socket.emit("game-played-cards", response);
            return;
        }

        const cardsPlayedString: string[] = JSON.parse(playedCardsJSON.playedCards);
        const cardsPlayed: Card[] = cardsPlayedString.map((cardString) => new Card(CardType[cardString as keyof typeof CardType]));
        const cardArray: CardArray = new CardArray(cardsPlayed);

        if(!await GameManager.handlePlay(cardArray, lobbyId, username))
        {
            const response: BackendGamePlayedCardsResponseJSON = 
            {
                error: true,
                errorMsg: "Could not play the cards",
                cardsSeeFuture: "",
                cardReceived: "",
            };
            
            logger.debug(`Sending response "game-played-cards":\t%j`, response);
            socket.emit("game-played-cards", response)
            return;
        }
    
    });


    socket.on("winner", async (response: FrontendWinnerResponseJSON) => {
       
        const username: string = socket.data.user.username;
        
        logger.info(`User "${username}" sent "winner" message`);
        logger.debug(`Received "winner":\t%j`, response);

        handleError(response.error, response.errorMsg);

        await GameManager.handleWinner(username, response.coinsEarned, response.lobbyId);

    });

};