import { Card } from "./objects.js";
import readlineSync from 'readline-sync';

export { CallSystem, Terminal, Server };

abstract class CallSystem {
    abstract makeCall(): void;
    abstract get_played_cards(): number;
    abstract get_played_favor(n_players: number): number;
}

class Terminal extends CallSystem {
    makeCall(): void {
        console.log("Making a call from the terminal.");
    }

    get_played_cards(): number {
        return parseInt(readlineSync.question(`What card do you want to play (if any type -1)`));
    }

    get_played_favor(n_players:number): number {
        let playerId: number;
    
        do {
            playerId = parseInt(readlineSync.question(`Who do you want to steal a card from? (${0}-${n_players-1}): `), 10);
        } while (isNaN(playerId) || playerId < 0 || playerId > n_players-1);

        return playerId;
    }
}

class Server extends CallSystem {
    makeCall(): void {
        console.log("Making a call from the server.");
    }

    get_played_cards(): number {
        throw new Error("Method not implemented.");
    }
    get_played_favor(n_players:number): number {
        throw new Error("Method not implemented.");
    }
}