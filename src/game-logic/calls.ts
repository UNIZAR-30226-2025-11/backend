import { Card } from "./objects.js";
import readlineSync from 'readline-sync';

export { CallSystem, Terminal, Server };

abstract class CallSystem {
    abstract makeCall(): void;
    abstract get_played_cards(): number;
}

class Terminal extends CallSystem {
    makeCall(): void {
        console.log("Making a call from the terminal.");
    }

    get_played_cards(): number {
        return parseInt(readlineSync.question(`What card do you want to play (if any type -1)`));
    }
}

class Server extends CallSystem {
    makeCall(): void {
        console.log("Making a call from the server.");
    }
}