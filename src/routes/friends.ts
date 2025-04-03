import { Router } from "express";
 
import {
    protectRoute
} from "../middleware/auth.js";

import { FRIENDS_API,ALL_USERS, FRIENDS_REQ} from "../api/restAPI.js";
import { friendsRepository } from "../repositories/friendsRepository.js";
import logger from "../config/logger.js";

const friendRouter = Router();
friendRouter.use(protectRoute);

friendRouter
    .route(FRIENDS_API)

    // Obtain all friends for the user
    .get(async (req, res) => {
        try {
            const userUsername = req.body.username;
            const friends = await friendsRepository.obtainFriends(userUsername);
            const numReq = await friendsRepository.numRequest(userUsername);
            res.json({
                users: friends,
                numRequests: numReq
            });


            logger.info(`[FRIENDS] Friends send correctly`);
        } catch (error) {
            console.error("Error in add:", error);
            res.status(400).json({ error: "Not posible to access to the friends" });
        }
    })

    // Make a new friend
    .post(async (req, res) => {
        try {
            const userId = req.body.username;
            const { username } = req.body.resp;
    
            if (!username) {
                res.status(400).json({ error: "username are required" });
            }

            await friendsRepository.addNewFriend(username, userId);
            
            logger.info(`[FRIENDS] The friend has been added`);
            
            res.status(200).json({ message: "New friend add successfully", userId });
        }
        catch (error) {
            console.error("Error in add:", error);
            res.status(500).json({ error: "Error adding a new friend" });
        }
    })

    .delete(async (req, res) => {
        try {
            const userId = req.body.username;
            const { username } = req.body.resp;
    
            if (!username) {
                res.status(400).json({ error: "username are required" });
            }

            await friendsRepository.deleteNewFriend(username, userId);

            logger.info(`[FRIENDS] The friend has been eliminated`);
            
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
    .get(async (req, res) => {
        try {
            const userId = req.body.username;
            const friends = await friendsRepository.searchNewFriends(userId);
            res.json({users: friends});

            logger.info(`[FRIENDS] Obtaining all users`);
        } catch (error) {
            console.error("Error in delete:", error);
            res.status(400).json({ error: "Not posible to access to the friends" });
        }
    });

friendRouter
    .route(FRIENDS_REQ)

    // friends petitions
    .get(async (req, res) => {
        try {
            const userId = req.body.username;
            const friends = await friendsRepository.obtainAppliedFriends(userId);
            res.json(friends);
            logger.info(`[FRIENDS] Obtaining all requests`);
        } catch (error) {
            console.error("Error in delete:", error);
            res.status(400).json({ error: "Not posible to access to the friends" });
        }
    })

    .post(async (req, res) =>{
        try {
            const userId = req.body.username;
            const { username,accept } = req.body.resp;
            if(accept){
                await friendsRepository.acceptNewFriend(userId, username);
                logger.info(`[FRIENDS] Accept one friend`);
            } else{
                await friendsRepository.deleteNewFriend(userId, username);
                logger.info(`[FRIENDS] Refuse one friend`);
            }
        } catch (error) {
            console.error("Error in delete:", error);
            res.status(400).json({ error: "Not posible to access to the friends" });
        }
    });


export { friendRouter };
