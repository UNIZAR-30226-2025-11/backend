import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import assert from "node:assert";

assert.ok(process.env.JWT_SECRET, "No JWT_SECRET provided");
const JWT_SECRET = process.env.JWT_SECRET;

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

/**
 * Prevent other users to modify user profiles that are not theirs
 */
export function protectUsersFromModification(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.cookies.access_token;
  const { username, uuid } = req.params;

  try {
    let decoded = jwt.verify(token, JWT_SECRET) as {
      username: string;
      id: string;
    };

    console.log(decoded);
    console.log(req.params);

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
