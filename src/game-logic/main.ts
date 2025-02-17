import { GameObject } from "./objects.js";
import { CallSystem, Terminal } from './calls.js';


function main() {
    const gameObject = new GameObject(0, 2, new Terminal());

    gameObject.play_turn();

}

main();