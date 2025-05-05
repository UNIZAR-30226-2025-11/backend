import { config } from "dotenv";
import assert from "node:assert";
import { CardType } from "./models/Card.js";

config();
config({ path: ".env.game" });

if (!process.env.PORT) console.log(`Using default PORT: 8000`);
if (!process.env.PGHOST) console.log(`Using default PGHOST: localhost`);
if (!process.env.PGPORT) console.log("Using default PGPORT: 5432 ");
if (!process.env.FRONTEND_URL) {
  console.log(
    "Using wildcard CORS origin. REQUESTS WITH COOKIES WILL BE THROWN OUT",
  );
}
if (process.env.SECURE_COOKIES)
  console.log(`Assuming HTTPS, Will use sameSite: "none" and secure: true`);

assert(process.env.JWT_SECRET, "No JWT_SECRET provided");

export const LOG_LEVEL: string = process.env.LOG_LEVEL || "info";
export const ENABLE_LOGGING: boolean = process.env.ENABLE_LOGGING === "true";

export const PORT: string = process.env.PORT || "8000";

export const PGHOST: string = process.env.PGHOST || "localhost";
export const PGPORT: number = Number(process.env.PGPORT) || 5432;

export const FRONTEND_URL: string[] | string =
  process.env.FRONTEND_URL?.split(",") || "*";

export const JWT_SECRET: string = process.env.JWT_SECRET;

export const SECURE_COOKIES: boolean = process.env.SECURE_COOKIES
  ? true
  : false;

// ----------------------------------------
// GAME CONFIGURATION
// ----------------------------------------

export const INITIAL_HAND_SIZE: number = parseInt(
  process.env.INITIAL_HAND_SIZE || "6",
  10,
);

// console.log(`Using initial hand size: ${INITIAL_HAND_SIZE}`);

export const TURN_TIME_LIMIT: number = parseInt(
  process.env.TURN_TIME_LIMIT || "60000",
  10,
);
export const TIMEOUT_RESPONSE: number = parseInt(
  process.env.TIMEOUT_RESPONSE || "10000",
  10,
);


// console.log(`Using turn time limit: ${TURN_TIME_LIMIT}ms`);
// console.log(`Using timeout response: ${TIMEOUT_RESPONSE}ms`);

export const CARD_COUNTS: { [key in CardType]: number } = {

    // Extra cards. These are cards that depend on the number of players in the game.
    [CardType.Bomb]: 0,
    [CardType.Deactivate]: 0,

    // Base cards. These are cards that are always present in the game.
    [CardType.SeeFuture]: parseInt(process.env.CARD_SEE_FUTURE || "5", 10),
    [CardType.Shuffle]: parseInt(process.env.CARD_SHUFFLE || "4", 10),
    [CardType.Skip]: parseInt(process.env.CARD_SKIP || "4", 10),
    [CardType.Attack]: parseInt(process.env.CARD_ATTACK || "4", 10),
    [CardType.Nope]: parseInt(process.env.CARD_NOPE || "5", 10),
    [CardType.Favor]: parseInt(process.env.CARD_FAVOR || "4", 10),
    [CardType.RainbowCat]: parseInt(process.env.CARD_RAINBOW_CAT || "4", 10),
    [CardType.TacoCat]: parseInt(process.env.CARD_TACO_CAT || "4", 10),
    [CardType.HairyPotatoCat]: parseInt(process.env.CARD_HAIRY_POTATO_CAT || "4", 10),
    [CardType.Cattermelon]: parseInt(process.env.CARD_CATTERMELON || "4", 10),
    [CardType.BeardCat]: parseInt(process.env.CARD_BEARD_CAT || "4", 10),

};

// console.log("Using card counts: ", CARD_COUNTS);

const totalCardCount = Object.values(CARD_COUNTS).reduce(
  (sum, count) => sum + count,
  0,
);

if (INITIAL_HAND_SIZE * 4 > totalCardCount) {
  console.error(
    `Initial hand size (${INITIAL_HAND_SIZE}) is too small for the number of cards (${totalCardCount}) if 4 players are playing.`,
  );
}

export const EXTRA_BOMBS: number = parseInt(
  process.env.CARD_BOMB_EXTRA || "0",
  10,
);
export const EXTRA_DEACTIVATES: number = parseInt(
  process.env.CARD_DEACTIVATE_EXTRA || "0",
  10,
);

// console.log(`Using ${EXTRA_BOMBS} extra bombs and ${EXTRA_DEACTIVATES} extra deactivates`);
