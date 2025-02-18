import { Card, Player, CardType, CardArray, AttackType } from "./objects.js";
import readlineSync from 'readline-sync';

export { CallSystem, Terminal };

abstract class CallSystem {
    
    // Call methods
    
    abstract get_played_cards(): number;
    abstract get_a_selected_card(player_to_steal: Player): number;
    abstract get_a_player_id(): number;
    abstract get_nope_card(): boolean;


    // Show methods

    abstract notify_bomb_defused(player: Player): void;
    abstract notify_current_hand(player:Player): void;
    abstract notify_hidden_cards(cards: CardArray, player:Player): void;
    abstract notify_new_cards(player:Player): void;
    abstract notify_attack(player: Player, type_attack:AttackType): void;
    abstract notify_attack_result(attacked_player: Player, current_player:Player, type_attack:AttackType, result:boolean): void;



    // Broadcast methods

    abstract broad_cast_player_turn(player:Player): void;
    abstract broad_cast_notify_bomb_defused(player: Player): void;
    abstract broad_cast_notify_bomb_exploded(player: Player): void;
    abstract broad_cast_notify_winner(player: Player): void;
    abstract broad_cast_card_used(player: Player, card_type: CardType): void;
}

class Terminal extends CallSystem {

    get_played_cards(): number {
        return parseInt(readlineSync.question(`What card do you want to play (if any type -1): `));
    }

    get_a_selected_card(player: Player): number {
        return parseInt(readlineSync.question(`Player ${player.id}: What card do you want to give?`));
    }

    get_a_player_id(): number {
        return parseInt(readlineSync.question(`What player do you want to select: `));
    }

    get_nope_card(): boolean {
        return readlineSync.keyInYNStrict(`Do you want to play a Nope card?`);
    }

    notify_current_hand(player: Player): void {
        console.log(`[PERSONAL ${player.id}] Player ${player.id} has cards: ${player.hand.toString()}`);
    }

    notify_hidden_cards(cards: CardArray, player:Player): void {
        console.log(`[PERSONAL ${player.id}] Player ${player.id} can see the cards: ${cards.toString()}`);
    }

    notify_new_cards(player:Player): void {
        console.log(`[PERSONAL ${player.id}] Player ${player.id} has new cards: ${player.hand.toString()}`);
    }

    notify_bomb_defused(player: Player): void {
        console.log(`[PERSONAL ${player.id}] Player ${player.id} has defused the bomb with a deactivation card!`);
    }

    notify_attack(player: Player, type_attack:AttackType): void {
        console.log(`[PERSONAL ${player.id}] Player ${player.id} has attacked with a ${AttackType[type_attack]} attack!`);
    }

    notify_attack_result(attacked_player: Player, current_player: Player, type_attack: AttackType, result: boolean): void {
        if (result) {
            console.log(`[PERSONAL ${attacked_player.id}] Player ${attacked_player.id} has been attacked by player ${current_player.id} with a ${AttackType[type_attack]} attack!`);
            console.log(`[PERSONAL ${attacked_player.id}] Player ${attacked_player.id} has lost the round!`);
        } else {
            console.log(`[PERSONAL ${attacked_player.id}] Player ${attacked_player.id} has been attacked by player ${current_player.id} with a ${AttackType[type_attack]} attack!`);
            console.log(`[PERSONAL ${attacked_player.id}] Player ${attacked_player.id} has defended the round!`);
        }
    }

    
    broad_cast_player_turn(player:Player): void {
        console.log(`[BROADCAST] Player ${player.id} is playing.`);
    }

    broad_cast_notify_bomb_defused(player: Player): void {
        console.log(`[BROADCAST] Player ${player.id} has defused the bomb! The bomb goes back to the deck.`);
    }

    broad_cast_notify_bomb_exploded(player: Player): void {
        console.log(`[BROADCAST] Player ${player.id} has exploded the bomb! He is out of the game.`);
    }

    broad_cast_notify_winner(player: Player): void {
        console.log(`[BROADCAST] Player ${player.id} has won the game!`);
    }

    broad_cast_card_used(player: Player, card_type: CardType): void {
        console.log(`[BROADCAST] Player ${player.id} has used a ${CardType[card_type]} card!`);
    }

}
