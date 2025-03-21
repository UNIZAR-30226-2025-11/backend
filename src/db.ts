import pg from "pg";

import { PGHOST, PGPORT } from "./config.js";

// https://node-postgres.com/apis/pool

export const db = new pg.Pool({
    host: PGHOST,
    port: PGPORT,
});
