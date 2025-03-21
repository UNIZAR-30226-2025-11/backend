import winston from "winston";
import fs from "fs";
import { ENABLE_LOGGING, LOG_LEVEL } from "../config.js";

// Logs files
const logFiles = ["logs/error.log", "logs/combined.log"];

// Reset logs before starting (truncate)
logFiles.forEach((file) => {
	fs.writeFileSync(file, ""); // Clears the file content
});

// Define log format
const logFormat = winston.format.combine(
	winston.format.splat(),
	winston.format.timestamp({
		format: "YYYY-MM-DD HH:mm:ss",
	}),
	winston.format.printf(({ level, message, timestamp }) => {
		return `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
	}),
);

// Create logger
const logger = winston.createLogger({
	level: LOG_LEVEL,
	format: logFormat,
	transports: [
		new winston.transports.File({ filename: "logs/error.log", level: "error" }), // Only errors
		new winston.transports.File({ filename: "logs/combined.log" }), // All logs
	]
});

// Log to console as well, if logging is enabled in .env
if (ENABLE_LOGGING) {
	logger.add(new winston.transports.Console({
		format: winston.format.combine(
			logFormat,
			winston.format.colorize({ all: true }), // Colors for console output
		)
	}));
}

export default logger;