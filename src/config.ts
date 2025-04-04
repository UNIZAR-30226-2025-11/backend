import { config } from "dotenv";
import assert from "node:assert";

config();

if (!process.env.PORT) console.log(`Using default PORT: 8000`);
if (!process.env.PGHOST) console.log(`Using default PGHOST: localhost`);
if (!process.env.PGPORT) console.log("Using default PGPORT: 5432 ");
if (!process.env.FRONTEND_URL){
    console.log(
        "Using wildcard CORS origin. REQUESTS WITH COOKIES WILL BE THROWN OUT",
    );
}

assert(process.env.JWT_SECRET, "No JWT_SECRET provided");

export const LOG_LEVEL: string = process.env.LOG_LEVEL || "info";
export const ENABLE_LOGGING: boolean = process.env.ENABLE_LOGGING === "true";

export const PORT: string = process.env.PORT || "8000";

export const PGHOST: string = process.env.PGHOST || "localhost";
export const PGPORT: number = Number(process.env.PGPORT) || 5432;

export const FRONTEND_URL: string[] | string = process.env.FRONTEND_URL?.split(",") || "*";

export const JWT_SECRET: string = process.env.JWT_SECRET;
