export class PlayerHistory {
    username: string;
    lobbyId: string;
    isWinner: boolean;
    gameDate: Date;
    timePlayed: number;
    turnsPlayed: number;

    constructor(
        username: string,
        lobbyId: string,
        isWinner: boolean,
        gameDate: Date,
        timePlayed: number,
        turnsPlayed: number
    ) {
        this.username = username;
        this.lobbyId = lobbyId;
        this.isWinner = isWinner;
        this.gameDate = gameDate;
        this.timePlayed = timePlayed;
        this.turnsPlayed = turnsPlayed;
    }
}