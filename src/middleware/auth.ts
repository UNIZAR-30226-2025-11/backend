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

/**
 * Prevent other users to modify user profiles that are not theirs
 */
export function protectUsersFromModification(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    logger.verbose(`[USERS] Checking user modification permissions`);
    const { username, uuid } = req.params;

    const decoded = req.body;

    try {
        if (
            (username && decoded.user !== username) ||
            (uuid && decoded.id !== uuid)
        ) {
            logger.warn(`[USERS] User ${decoded.username} cannot modify other users data`);
            logger.silly(`[USERS] User ${decoded.username} cannot modify user ${username}`);
            res.status(403).send({ message: "Cannot modify other users data" });
            return;
        }
    } catch {
        logger.warn(`[USERS] Invalid token`);
        res.status(401).send({ message: "Invalid token" });
        return;
    }

    next();
}
