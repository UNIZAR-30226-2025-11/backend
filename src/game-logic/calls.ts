import { Card, Player, CardType, CardArray, AttackType } from "./objects.js";
import readlineSync from 'readline-sync';

export { CallSystem, Terminal };
interface CallSystem {
    
    // Call methods
    
    get_played_cards(player: Player): number[];
    get_a_selected_card(player_to_steal: Player): number;
    get_a_player_id(player: Player): number;
    get_nope_card(player: Player): boolean;
    get_a_card_type(player: Player): CardType;


    // Show methods

    notify_bomb_defused(player: Player): void;
    notify_current_hand(player: Player): void;
    notify_hidden_cards(cards: CardArray, player: Player): void;
    notify_new_cards(player: Player): void;
    notify_attack(player: Player, type_attack: AttackType): void;
    notify_attack_result(attacked_player: Player, current_player: Player, type_attack: AttackType, result: boolean): void;
    
    // Broadcast methods

    broad_cast_failed_steal(player: Player, player_to_steal: Player, card_type: CardType): void;
    broad_cast_player_turn(player: Player): void;
    broad_cast_notify_bomb_defused(player: Player): void;
    broad_cast_notify_bomb_exploded(player: Player): void;
    broad_cast_notify_winner(player: Player): void;
    broad_cast_card_used(player: Player, card_type: CardType, number_of_played_cards: number): void;
}

class Terminal implements CallSystem {

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
    
    get_other_wild_card(): number {
        return parseInt(readlineSync.question(`You have to play another card like this (if any -1)`));
    }

    get_played_favor(n_players:number): number {
        let playerId: number;
    
        do {
            playerId = parseInt(readlineSync.question(`Who do you want to steal a card from? (${0}-${n_players-1}): `), 10);
        } while (isNaN(playerId) || playerId < 0 || playerId > n_players-1);

        return playerId;
    }

    get_a_wild_card(): CardType {
        const answer = readlineSync.question(`Which card do you want to steal? `).trim();
        
        // Primero, intenta convertir la respuesta a número, por si el usuario ingresa un valor numérico.
        const asNumber = parseInt(answer);
        if (!isNaN(asNumber) && CardType[asNumber] !== undefined) {
            return asNumber as CardType;
        }

        // Si no es numérico, intenta usar la cadena para obtener el valor del enum.
        const cardType = CardType[answer as keyof typeof CardType];
        if (cardType !== undefined) {
            return cardType;
        }

        throw new Error(`Invalid card type provided: ${answer}`);
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

class Sockets implements CallSystem {

    /**
     * JSON:
     * username
     * id[] (vacio -1)
     */
    get_played_cards(player: Player): number[]{
        return []

    }

    /**
     * JSON:
     */
    get_a_selected_card(player_to_steal: Player): number{
        return 0

    }

    /**
     * JSON:
     */
    get_a_player_id(player: Player): number{
        return 0
    }

    /**
     * JSON:
     */
    get_nope_card(player: Player): boolean{
        return true
    }

    /**
     * JSON:
     */
    get_a_card_type(player: Player): CardType{
        return CardType.Nope
    }


    // Show methods

    /**
     * JSON:
     */
    notify_bomb_defused(player: Player): void{
        return
    }

    /**
     * JSON:
     * N_Players: 
     * PlayerS: []
     * Cards: [name, id]
     */
    notify_current_hand(player:Player): void{
        return 
    }

    /**
     * JSON:
     */
    notify_hidden_cards(cards: CardArray, player:Player): void{
        return
    }

    /**
     * JSON:
     */
    notify_new_cards(player:Player): void{
        return
    }

    /**
     * JSON:
     */
    notify_attack(player: Player, type_attack:AttackType): void{
        return
    }

    /**
     * JSON:
     */
    notify_attack_result(attacked_player: Player, current_player:Player, type_attack:AttackType, result:boolean): void{
        return
    }
    
    // Broadcast methods

    /**
     * JSON:
     */
    broad_cast_failed_steal(player: Player, player_to_steal: Player, card_type: CardType): void{
        return
    }

    /**
     * JSON:
     */
    broad_cast_player_turn(player:Player): void{
        return
    }

    /**
     * JSON:
     */
    broad_cast_notify_bomb_defused(player: Player): void{
        return
    }

    /**
     * 
     */
    broad_cast_notify_bomb_exploded(player: Player): void{
        return
    }

    /**
     * 
     */
    broad_cast_notify_winner(player: Player): void{
        return
    }

    /**
     * 
     */
    broad_cast_card_used(player: Player, card_type: CardType, number_of_played_cards:number): void{
        return
    }
}
