import { Card , CardType} from "./objects.js";
import readlineSync from 'readline-sync';

export { CallSystem, Terminal, Server };

abstract class CallSystem {
    abstract makeCall(): void;
    abstract get_played_cards(): number;
    abstract get_other_wild_card():number;
    abstract get_played_favor(n_players: number): number;
    abstract get_a_wild_card(): CardType ;
}

class Terminal extends CallSystem {
    makeCall(): void {
        console.log("Making a call from the terminal.");
    }

    get_played_cards(): number {
        return parseInt(readlineSync.question(`What card do you want to play (if any type -1)`));
    }

    get_other_wild_card(): number {
        return parseInt(readlineSync.question(`You have to play another card like this (if any -1)`));
    }

    get_played_favor(n_players:number): number {
        let playerId: number;
    
        do {
            playerId = parseInt(readlineSync.question(`Who do you want to steal a card from? (${0}-${n_players-1}): `), 10);
        } while (isNaN(playerId) || playerId < 0 || playerId > n_players-1);

        return playerId;
    }

    get_a_wild_card(): CardType {
        const answer = readlineSync.question(`Which card do you want to steal? `).trim();
        
        // Primero, intenta convertir la respuesta a número, por si el usuario ingresa un valor numérico.
        const asNumber = parseInt(answer);
        if (!isNaN(asNumber) && CardType[asNumber] !== undefined) {
            return asNumber as CardType;
        }

        // Si no es numérico, intenta usar la cadena para obtener el valor del enum.
        const cardType = CardType[answer as keyof typeof CardType];
        if (cardType !== undefined) {
            return cardType;
        }

        throw new Error(`Invalid card type provided: ${answer}`);
    }
}

class Server extends CallSystem {
    makeCall(): void {
        console.log("Making a call from the server.");
    }

    get_played_cards(): number {
        throw new Error("Method not implemented.");
    }

    get_other_wild_card(): number {
        throw new Error("Method not implemented.");
    }

    get_played_favor(n_players:number): number {
        throw new Error("Method not implemented.");
    }
    get_a_wild_card(): CardType {
        throw new Error("Method not implemented.");
    }
}