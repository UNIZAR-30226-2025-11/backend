import { CardArray } from "./CardArray.js";

export class Play{
    public playedCards: CardArray;
    public idPlayer: number;

    constructor(idPlayer:number, cards:CardArray){
        this.idPlayer = idPlayer;
        this.playedCards = cards;
    }

    public isPlayable(): boolean{
        return this.playedCards.arePlayable();
    }
}