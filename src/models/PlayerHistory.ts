export class PlayerHistory {
    username: string;
    lobbyId: string;
    isWinner: boolean;
    coinsEarned: number;
    gameDate: Date;
    timePlayed: number;
    turnsPlayed: number;

    constructor(
        username: string,
        lobbyId: string,
        isWinner: boolean,
        coinsEarned: number,
        gameDate: Date,
        timePlayed: number,
        turnsPlayed: number
    ) {
        this.username = username;
        this.lobbyId = lobbyId;
        this.isWinner = isWinner;
        this.coinsEarned = coinsEarned;
        this.gameDate = gameDate;
        this.timePlayed = timePlayed;
        this.turnsPlayed = turnsPlayed;
    }
}