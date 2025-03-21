import winston from "winston";
import { ENABLE_LOGGING, LOG_LEVEL } from "../config.js";

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(({ level, message, timestamp }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  })
);

// Create logger
const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: logFormat,
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }), // Only errors
    new winston.transports.File({ filename: "logs/combined.log" }) // All logs
  ]
});

// Log to console as well, if logging is enabled in .env
if (ENABLE_LOGGING) {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(), // Colors for console output
      logFormat
    )
  }));
}

export default logger;