// Global constants used throughout the game

import logger from "../config/logger.js";

export const TIME_FORMAT =  "dd/MM/yyyy HH:mm:ss";

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
