import { Card } from './Card.js';
import { Player } from './Player.js';

export class Move {
    played_card: Card;
    player: Player;

    constructor(played_card: Card, player: Player) {
        this.played_card = played_card;
        this.player = player;
    }
}

export class MoveHistory {
    moves: Move[];

    constructor() {
        this.moves = [];
    }

    add_move(move: Move): void {
        this.moves.push(move);
    }

    get_last_move(): Move {
        if (this.moves.length === 0) {
            throw new Error('No moves to pop from the history');
        }
        return this.moves[this.moves.length - 1];
    }
}