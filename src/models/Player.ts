import { CardArray } from "./CardArray.js";
import { Deck } from "./Deck.js";
import { CardType } from "./Card.js";
import { PlayerJSON } from "../api/socketAPI.js";
import { INITIAL_HAND_SIZE } from "../config.js";

export class Player {
    id: number;
    username: string;
    avatar: string;
    disconnected: boolean = false;
    active: boolean = true;
    hand: CardArray;

    constructor(id:number, username:string, hand:CardArray, avatar:string) {
        this.id = id;
        this.avatar = avatar;
        this.username = username;
        this.hand = hand;
    }

    /**
    * Create a player
    * @param id - Id of the player
    * @param deck - Deck initial
    * @returns A player
    */
    static createStandarPlayer(id:number, username:string, avatar:string, deck: Deck): Player {
        
        // Create a hand with 7 cards
        const hand = deck.draw(INITIAL_HAND_SIZE);
    
        // Add the deactive card 
        hand.push(deck.getNewCard(CardType.Deactivate));

        return new Player(id, username, hand, avatar);
    }
    
    toJSONHidden(): PlayerJSON{
        const response : PlayerJSON = {
            playerUsername : this.username,
            playerAvatar : this.avatar,
            numCards: this.hand.length(),
            active: this.active,
            disconnected: this.disconnected,
        };
        return response;
    }
}
