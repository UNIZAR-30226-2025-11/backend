// Global constants used throughout the game

import logger from "../config/logger.js";

export const INITIAL_HAND_SIZE = 6;
export const TURN_TIME_LIMIT = 1000000;
export const TIMEOUT_RESPONSE = 1000000;

export function handleError(error: boolean|undefined, errorMsg: string|undefined): void {
    if (error === undefined || errorMsg === undefined) {
        logger.error(" Not <error> or <errorMsg> specify")
        return;
    }

    if (error){
        logger.error("Error: ", errorMsg);
        return;
    }
}
