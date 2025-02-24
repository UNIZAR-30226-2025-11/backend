import pg from "pg";

// https://node-postgres.com/apis/pool

export const db = new pg.Pool({
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT) || 5432,
});
