import { Socket } from "socket.io";
import { GameManager } from "../managers/gameManager.js";
import { 
    FrontendGamePlayedCardsJSON,
    BackendGamePlayedCardsResponseJSON,
    FrontendPostMsgJSON
} from "../api/socketAPI.js";
import { CardArray } from "../models/CardArray.js";
import { handleError } from "../constants/constants.js";
import logger from "../config/logger.js";
import { FrontendGamePlayedCardsJSONSchema, FrontendPostMsgJSONSchema} from "../schemas/socketAPI.js";
import { LobbyManager } from "../managers/lobbyManager.js";

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

        if (!await LobbyManager.lobbyExists(lobbyId)) {
            
            logger.warn(`Lobby ${lobbyId} does not exist!`);
            return;
        }

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

    socket.on("post-message", async (data: unknown) => {

        const username: string = socket.data.user.username;

        logger.info(`Post message request received from user "${username}"`);
        logger.debug(`Received "post-message":\n%j`, data);

        const parsed = FrontendPostMsgJSONSchema.safeParse(data);

        if (!parsed.success) {
            logger.warn(`Invalid JSON: ${parsed.error}`);
            return;
        }

        const msg: FrontendPostMsgJSON = parsed.data as FrontendPostMsgJSON;

        handleError(msg.error, msg.errorMsg);

        if (!await LobbyManager.lobbyExists(msg.lobbyId)) {
            
            logger.warn(`Lobby ${msg.lobbyId} does not exist!`);
            return;
        }

        GameManager.addMessage(msg.msg, username, msg.lobbyId);
    });

};