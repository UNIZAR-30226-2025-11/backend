export class PlayerHistory {
    username: string;
    lobbyId: string;
    isWinner: boolean;
    coinsEarned: number;
    gameDate: Date;
    disconnected: boolean;
    timePlayed: number;
    turnsPlayed: number;

    constructor(
        username: string,
        lobbyId: string,
        isWinner: boolean,
        coinsEarned: number,
        gameDate: Date,
        disconnected: boolean,
        timePlayed: number,
        turnsPlayed: number
    ) {
        this.username = username;
        this.lobbyId = lobbyId;
        this.isWinner = isWinner;
        this.coinsEarned = coinsEarned;
        this.gameDate = gameDate;
        this.disconnected = disconnected;
        this.timePlayed = timePlayed;
        this.turnsPlayed = turnsPlayed;
    }
}