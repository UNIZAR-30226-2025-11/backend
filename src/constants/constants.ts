// Global constants used throughout the game

export const INITIAL_HAND_SIZE = 6;
export const TURN_TIME_LIMIT = 100000;
export const TIMEOUT_RESPONSE = 100000;


export function handleError(error: boolean|undefined, errorMsg: string|undefined): void {
    if (error === undefined || errorMsg === undefined) {
        console.log(" Not <error> or <errorMsg> specify")
        return;
    }

    if (error){
        console.log("Error: ", errorMsg);
        return;
    }
}
