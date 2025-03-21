import { CardArray } from "./CardArray.js";

export class Play{
    public playedCards: CardArray;
    public username: string;

    constructor(username:string, cards:CardArray){
        this.username = username;
        this.playedCards = cards;
    }

    public isPlayable(): boolean{
        return this.playedCards.arePlayable();
    }
}