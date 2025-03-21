import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Socket } from "socket.io";
import cookie from "cookie";

import { JWT_SECRET } from "../config.js";

/**
 * Check for access token. If invalid, reject request.
 */
export function protectRoute(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.access_token;

  if (!token) {
    res.status(401).send({ message: "No access token" });
    return;
  }

  try {
    jwt.verify(token, JWT_SECRET);
  } catch (_) {
    res.status(401).send({ message: "Invalid token" });
    return;
  }

  next();
}

export function protectSocket(socket: Socket, next: (err?: Error) => void) {
  const token = cookie.parse(
    socket.handshake.headers.cookie || "",
  ).access_token;

  if (!token) {
    socket.disconnect(true);
    return next(new Error("No access token"));
  }

  try {
    jwt.verify(token, JWT_SECRET);
  } catch (_) {
    socket.disconnect(true);
    return next(new Error("Invalid token"));
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
  const token = req.cookies.access_token;
  const { username, uuid } = req.params;

  try {
    let decoded = jwt.verify(token, JWT_SECRET) as {
      username: string;
      id: string;
    };

    if (
      (username && decoded.username !== username) ||
      (uuid && decoded.id !== uuid)
    ) {
      res.status(403).send({ message: "Cannot modify other users data" });
      return;
    }
  } catch {
    res.status(401).send({ message: "Invalid token" });
    return;
  }

  next();
}
