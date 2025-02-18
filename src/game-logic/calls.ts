import { Card, Player, CardType, CardArray, AttackType } from "./objects.js";
import readlineSync from 'readline-sync';

export { CallSystem, Terminal };

abstract class CallSystem {
    
    // Call methods
    
    abstract get_played_cards(player: Player): number[];
    abstract get_a_selected_card(player_to_steal: Player): number;
    abstract get_a_player_id(player: Player): number;
    abstract get_nope_card(player: Player): boolean;
    abstract get_a_card_type(player: Player): CardType;


    // Show methods

    abstract notify_bomb_defused(player: Player): void;
    abstract notify_current_hand(player:Player): void;
    abstract notify_hidden_cards(cards: CardArray, player:Player): void;
    abstract notify_new_cards(player:Player): void;
    abstract notify_attack(player: Player, type_attack:AttackType): void;
    abstract notify_attack_result(attacked_player: Player, current_player:Player, type_attack:AttackType, result:boolean): void;
    
    // Broadcast methods

    abstract broad_cast_failed_steal(player: Player, player_to_steal: Player, card_type: CardType): void;
    abstract broad_cast_player_turn(player:Player): void;
    abstract broad_cast_notify_bomb_defused(player: Player): void;
    abstract broad_cast_notify_bomb_exploded(player: Player): void;
    abstract broad_cast_notify_winner(player: Player): void;
    abstract broad_cast_card_used(player: Player, card_type: CardType, number_of_played_cards:number): void;
}

class Terminal extends CallSystem {

    get_played_cards(player: Player): number[] {
        let cards: number[] = [];
        const str:string = readlineSync.question(`What cards/s do you want to play (if any type -1, if multiple split with comma): `);
        if (str === "-1") {
            return cards;
        }
        const split_str = str.split(',');
        split_str.forEach((card) => {
            cards.push(parseInt(card));
        });

        return cards;
    }

    get_a_selected_card(player: Player): number {
        return parseInt(readlineSync.question(`[PERSONAL ${player.id}] What card do you want to give?`));
    }

    get_a_player_id(player: Player): number {
        return parseInt(readlineSync.question(`[PERSONAL ${player.id}] What player do you want to select: `));
    }

    get_nope_card(player: Player): boolean {
        return readlineSync.keyInYNStrict(`[PERSONAL ${player.id}] Do you want to play a Nope card?`);
    }

    get_a_card_type(player: Player): CardType {

        const map_card_type_to_int: Map<string, CardType> = new Map([
            ["SeeFuture", CardType.SeeFuture],
            ["Shuffle", CardType.Shuffle],
            ["Skip", CardType.Skip],
            ["Attack", CardType.Attack],
            ["Nope", CardType.Nope],
            ["Favor", CardType.Favor],
            ["Deactivate", CardType.Deactivate],
            ["RainbowCat", CardType.RainbowCat],
            ["PotatoCat", CardType.PotatoCat],
            ["TacoCat", CardType.TacoCat],
            ["HairyPotatoCat", CardType.HairyPotatoCat],
            ["Cattermelon", CardType.Cattermelon],
            ["BeardCat", CardType.BeardCat]
        ]);

        const cardTypeStr = readlineSync.question(`[PERSONAL ${player.id}] What type of card do you want to play (example "Skip"): `);
        return map_card_type_to_int.get(cardTypeStr) || CardType.Deactivate; // Default to Bomb if not found

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

    broad_cast_failed_steal(player: Player, player_to_steal: Player, card_type: CardType): void {
        console.log(`[BROADCAST] Player ${player.id} has failed to steal a card of type ${CardType[card_type]} from player ${player_to_steal.id}!`);
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

    broad_cast_card_used(player: Player, card_type: CardType, number_of_played_cards:number): void {
        console.log(`[BROADCAST] Player ${player.id} has used ${number_of_played_cards} number of ${CardType[card_type]} cards!`);
    }

}
