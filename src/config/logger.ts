import winston from "winston";
import fs from "fs";
import { ENABLE_LOGGING, LOG_LEVEL } from "../config.js";

// Logs files
const logDir = "logs";

// Create log directory if it does not exist
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logFiles = [
    `${logDir}/_logs.log`, // All logs
];

// Reset logs before starting (truncate)
logFiles.forEach((file) => {
    fs.writeFileSync(file, ""); // Clears the file content
});

// Custom colors for different log levels
const customColors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
};

// Add the custom colors to winston
winston.addColors(customColors);

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
        new winston.transports.File({ filename: "logs/_logs.log" }), // All logs
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