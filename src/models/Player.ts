import { CardArray } from "./CardArray.js";
import { Deck } from "./Deck.js";
import { Card, CardType } from "./Card.js";
import { INITIAL_HAND_SIZE } from "../constants/constants.js";
import { PlayerJSON } from "../api/socketAPI.js";

export class Player {
    id: number;
    username: string;
    disconnected: boolean = false;
    active: boolean = true;
    hand: CardArray;

    constructor(id:number, username:string, hand:CardArray) {
        this.id = id;
        this.username = username;
        this.hand = hand;
    }

    /**
    * Create a player
    * @param id - Id of the player
    * @param deck - Deck initial
    * @returns A player
    */
    static createStandarPlayer(id:number, username:string, deck: Deck): Player {
        // Create a hand with 7 cards
        const hand = deck.draw(INITIAL_HAND_SIZE);
    
        // Add the deactive card 
        hand.push(new Card(CardType.Deactivate));
        return new Player(id, username, hand);
    }
    
    toJSONHidden(): PlayerJSON{
        const response : PlayerJSON = {
            username : this.username,
            numCards: this.hand.length(),
            active: this.active
        };
        return response;
    }
}
