import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { JWT_SECRET } from "../config.js";
import logger from "../config/logger.js";

/**
 * Check for access token. If invalid, reject request.
 */
export function protectRoute(req: Request, res: Response, next: NextFunction) {
    
    logger.verbose(`[USERS] Checking access token`);
    const token = req.cookies.access_token;

    if (!token) {
        logger.warn(`[USERS] No access token provided`);
        res.status(401).send({ message: "No access token" });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as {
            username: string;
            id: string;
        };

        req.body.username = decoded.username;
        req.body.id = decoded.id;

    } catch (_) {
        logger.warn(`[USERS] Invalid token`);
        res.status(401).send({ message: "Invalid token" });
        return;
    }

    next();
}

