import { Router } from "express";
 
import {
    protectRoute
} from "../middleware/auth.js";

import { FRIENDS_API,ALL_USERS, FRIENDS_REQ} from "../api/restAPI.js";
import { friendsRepository } from "../repositories/friendsRepository.js";

const friendRouter = Router();
friendRouter.use(protectRoute);

friendRouter
    .route(FRIENDS_API)

    // Obtain all friends for the user
    .get(async (_req, res) => {
        try {
            const userId = (_req as any).user?.id;
            let friends = friendsRepository.obtainFriends(userId);
            let numReq = friendsRepository.numRequest(userId);
            res.json({
                user: friends,
                numReq: numReq
            });
        } catch (error) {
            res.status(400).json({ error: "Not posible to access to the friends" });
        }
    })

    // Make a new friend
    .post(async (_req, res) => {
        try {
            const userId = (_req as any).user?.id;
            const { username } = _req.body;
    
            if (!username) {
                res.status(400).json({ error: "username are required" });
            }

            friendsRepository.addNewFriend(username, userId);
            
            res.status(200).json({ message: "New friend add successfully", userId });
        }
        catch (error) {
            console.error("Error in add:", error);
            res.status(500).json({ error: "Error adding a new friend" });
        }
    })

    .delete(async (_req, res) => {
        try {
            const userId = (_req as any).user?.id;
            const { username } = _req.body;
    
            if (!username) {
                res.status(400).json({ error: "username are required" });
            }

            friendsRepository.deleteNewFriend(username, userId);
            
            res.status(200).json({ message: "New friend delete successfully", userId });
        }
        catch (error) {
            console.error("Error in delete:", error);
            res.status(500).json({ error: "Error deleting a new friend" });
        }
    });

friendRouter
    .route(ALL_USERS)

    // Obtain all users
    .get(async (_req, res) => {
        try {
            const userId = (_req as any).user?.id;
            let friends = friendsRepository.searchNewFriends(userId);
            res.json(friends);
        } catch (error) {
            res.status(400).json({ error: "Not posible to access to the friends" });
        }
    })

friendRouter
    .route(FRIENDS_REQ)

    // friends petitions
    .get(async (_req, res) => {
        try {
            const userId = (_req as any).user?.id;
            let friends = friendsRepository.obtainAppliedFriends(userId);
            res.json(friends);
        } catch (error) {
            res.status(400).json({ error: "Not posible to access to the friends" });
        }
    })

    .post(async (_req, res) =>{
        try {
            const userId = (_req as any).user?.id;
            const { username,accept } = _req.body;
            if(accept){
                friendsRepository.acceptNewFriend(userId, username);
            } else{
                friendsRepository.deleteNewFriend(userId, username);
            }
        } catch (error) {
            res.status(400).json({ error: "Not posible to access to the friends" });
        }
    });

export { friendRouter };
