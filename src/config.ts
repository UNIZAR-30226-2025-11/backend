import { config } from "dotenv";
import assert from "node:assert";

config();

if (!process.env.PORT) console.log("Using default PORT");
if (!process.env.PGHOST) console.log("Using default PGHOST");
if (!process.env.PGPORT) console.log("Using default PGHOST");
assert(process.env.JWT_SECRET, "No JWT_SECRET provided");

export const PORT = process.env.PORT || 8000;

export const PGHOST = process.env.PGHOST || "localhost";
export const PGPORT = Number(process.env.PGPORT) || 5432;

export const JWT_SECRET = process.env.JWT_SECRET;
