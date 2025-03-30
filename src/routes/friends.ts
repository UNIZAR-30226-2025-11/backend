import { Router } from "express";
 
import {
    protectRoute
} from "../middleware/auth.js";

import { FRIENDS_API, FriendsJSON} from "../api/restAPI.js";
import { friendsRepository } from "../repositories/friendsRepository.js";

const shopRouter = Router();
shopRouter.use(protectRoute);

shopRouter
    .route(FRIENDS_API)

    // Obtain all friends for the user
    .get(async (_req, res) => {
        try {
            const userId = (_req as any).user?.id;
            let friends = friendsRepository.obtainFriends(userId);

            res.json(JSON);
        } catch (error) {
            res.status(400).json({ error: "Not posible to access to the friends" });
        }
    })

    // Buy a new product
    .post(async (_req, res) => {
        try {
            const userId = (_req as any).user?.id;
            const { username } = _req.body;
    
            if (!username) {
                res.status(400).json({ error: "username are required" });
            }

            res.status(200).json({ message: "New friend add successfully", userId });
        }
        catch (error) {
            console.error("Error in purchase:", error);
            res.status(500).json({ error: "Error adding a new friend" });
        }
    });

export { shopRouter };
