import { Socket } from "socket.io";
import { GameManager } from "../managers/gameManager.js";
import { 
    FrontendGamePlayedCardsJSON,
    BackendGamePlayedCardsResponseJSON,
    FrontendWinnerResponseJSON,
    FrontendPostMsgJSON
} from "../api/socketAPI.js";
import { CardArray } from "../models/CardArray.js";
import { handleError } from "../constants/constants.js";
import logger from "../config/logger.js";
import { FrontendGamePlayedCardsJSONSchema, FrontendPostMsgJSONSchema, FrontendWinnerResponseJSONSchema } from "../schemas/socketAPI.js";

export const setupGameHandlers = (socket: Socket) => {

    socket.on("game-played-cards", async (data: unknown) => {
        
        const username: string = socket.data.user.username;

        logger.info(`User "${username}" sent "game-played-cards" message`);
        logger.debug(`Received "game-played-cards":\n%j`, data);

        const parsed = FrontendGamePlayedCardsJSONSchema.safeParse(data);

        if (!parsed.success) {
            logger.warn(`Invalid JSON: ${parsed.error}`);

            const response: BackendGamePlayedCardsResponseJSON = 
            {
                error: true,
                errorMsg: `Error ${parsed.error} in data sent.`,
                cardsSeeFuture: [],
                cardReceived: {id: -1, type: ""},
            };
            
            logger.debug(`Sending response "game-played-cards":\t%j`, response);
            socket.emit("game-played-cards", response);
            return;
        }

        const playedCardsJSON = parsed.data as FrontendGamePlayedCardsJSON;
        handleError(playedCardsJSON.error, playedCardsJSON.errorMsg);

        const lobbyId: string = playedCardsJSON.lobbyId;

        const playedCards: CardArray = CardArray.fromJSON(playedCardsJSON.playedCards);

        if(!await GameManager.handlePlay(playedCards, lobbyId, username))
        {
            const response: BackendGamePlayedCardsResponseJSON = 
            {
                error: true,
                errorMsg: "Could not play the cards",
                cardsSeeFuture: [],
                cardReceived: {id: -1, type: ""},
            };
            
            logger.debug(`Sending response "game-played-cards":\t%j`, response);
            socket.emit("game-played-cards", response)
            return;
        }
    
    });

    socket.on("post-message", (data: unknown) => {

        const username: string = socket.data.user.username;

        logger.info(`Post message request received from user "${username}"`);
        logger.debug(`Received "post-message":\n%j`, data);

        const parsed = FrontendPostMsgJSONSchema.safeParse(data);

        if (!parsed.success) {
            logger.warn(`Invalid JSON: ${parsed.error}`);
            return;
        }

        const msg: FrontendPostMsgJSON = parsed.data as FrontendPostMsgJSON;

        GameManager.addMessage(msg.msg, username, msg.lobbyId);
    });


    socket.on("winner", async (data: unknown) => {
       
        const username: string = socket.data.user.username;
        
        logger.info(`User "${username}" sent "winner" message`);
        logger.debug(`Received "winner":\n%j`, data);

        const parsed = FrontendWinnerResponseJSONSchema.safeParse(data);

        if (!parsed.success) {
            logger.warn(`Invalid JSON: ${parsed.error}`);
            return;
        }

        const response: FrontendWinnerResponseJSON = parsed.data as FrontendWinnerResponseJSON;

        handleError(response.error, response.errorMsg);

        await GameManager.handleWinner(username, response.coinsEarned, response.lobbyId);

    });

};