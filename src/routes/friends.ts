import { Router } from "express";
 
import {
    protectRoute
} from "../middleware/auth.js";

import { FRIENDS_API, FRIENDS_REQ, FriendsJSON, UserAvatarJSON} from "../api/restAPI.js";
import { FriendsRepository } from "../repositories/friendsRepository.js";
import logger from "../config/logger.js";

const friendRouter = Router();
friendRouter.use(protectRoute);

friendRouter
    .route(FRIENDS_API)

    // Obtain all friends for the user
    .get(async (req, res) => {
        try {

            logger.info(`[FRIENDS] Obtaining all friends`)
            const userUsername: string = req.body.username;
            const friends: FriendsJSON[] = await FriendsRepository.obtainFriends(userUsername);
            const numReq: number = await FriendsRepository.getPendingFriendRequestsCount(userUsername);
            
            logger.debug(`[FRIENDS] Friends: ${JSON.stringify(friends)}`);
            
            res.status(200).json({
                users: friends,
                numRequests: numReq
            });
            
            logger.info(`[FRIENDS] Friends send correctly`);
        } catch (error) {
            logger.error(`Error in add: ${error}`);
            res.status(404).json({ error: "Not posible to access to the friends" });
        }
    })

    // Create a friends request
    .post(async (req, res) => {
        try {

            logger.info(`[FRIENDS] Adding a new friend`);

            const username: string = req.body.username;
            const { username: friendUsername } = req.body.resp;

            logger.debug(`[FRIENDS] User ${username} is trying to add friend ${friendUsername}`);
    
            if (!friendUsername) {
                // Check if the friendUsername is provided
                logger.warn(`[FRIENDS] "username" field is required. None received.`);
                res.status(400).json({ error: "username is required" });
                return;
            }

            // Check if the user is already friends with the friendUsername
            const areFriends: boolean = await FriendsRepository.areFriends(username, friendUsername);
            if (areFriends) {
                logger.warn(`[FRIENDS] ${friendUsername} is already a friend`);
                res.status(400).json({ error: "User is already a friend" });
                return;
            }

            const haveAlreadySentRequest: boolean = await FriendsRepository.haveAlreadySentRequest(username, friendUsername);
            if (haveAlreadySentRequest) {
                logger.warn(`[FRIENDS] ${friendUsername} has already sent a request`);
                res.status(400).json({ error: "Friend request already sent" });
                return;
            }

            // Check if the user is trying to add themselves as a friend
            if (username === friendUsername) {
                logger.warn(`[FRIENDS] ${friendUsername} is trying to add himself`);
                res.status(400).json({ error: "User cannot add themselves as a friend" });
                return;
            }

            // Check if the friend has already sent a request
            const friendAlreadySentRequest: boolean = await FriendsRepository.haveAlreadySentRequest(friendUsername, username);
                

            if (friendAlreadySentRequest) {
                logger.warn(`[FRIENDS] ${friendUsername} has already sent a request. Making them friends`);
                await FriendsRepository.acceptNewFriend(friendUsername, username);
                res.status(200).json({ message: "Friend request accepted", userId: username });
                return;
            }

            await FriendsRepository.createNewFriendsRequest(username, friendUsername);
            
            logger.info(`[FRIENDS] The friend ${friendUsername} has been added`);
            
            res.status(200).json({ message: "New friend request added successfully", userId: username });
        }
        catch (error) {
            logger.error(`Error adding a new friend: ${error}`);
            res.status(404).json({ error: "Error adding a new friend" });
        }
    })

    .delete(async (req, res) => {
        try {
            logger.info(`[FRIENDS] Deleting a new friend`);
            const username :string = req.body.username;
            const { username: friendUsername } = req.body.resp;
            
            logger.debug(`[FRIENDS] User ${username} is trying to delete friend ${friendUsername}`);
            
            if (!friendUsername) {
                logger.warn(`[FRIENDS] "username" field is required. None received.`);
                res.status(400).json({ error: "username is required" });
            }

            await FriendsRepository.deleteFriendship(friendUsername, username);

            logger.info(`[FRIENDS] The friend ${friendUsername} has been eliminated`);
            
            res.status(200).json({ message: "New friend delete successfully", userId: username });
        }
        catch (error) {
            logger.error(`Error deleting a new friend: ${error}`);
            res.status(404).json({ error: "Error deleting a new friend" });
        }
    });

friendRouter
    .route(FRIENDS_REQ)

    // friends petitions
    .get(async (req, res) => {
        try {

            logger.info(`[FRIENDS] Obtaining all friend requests`);
            const username: string = req.body.username;
            const friends: UserAvatarJSON[] = await FriendsRepository.obtainPendingFriendRequestReceived(username);
            
            const msg = {
                users: friends,
            }

            logger.debug(`[FRIENDS] Friend pettitions: %j`, msg);

            res.status(200).json(msg);

            logger.info(`[FRIENDS] All friend pending requests sent correctly.`);
        } catch (error) {
            logger.error(`Error getting pending friend request: ${error}`);
            res.status(404).json({ error: "Not possible to get pending requests..." });
        }
    })

    .post(async (req, res) =>{
        try {
            logger.info(`[FRIENDS] Accepting or refusing a friend request`);
            const username: string = req.body.username;
            const { username: friendRequest, accept } = req.body.resp;
            
            logger.debug(`[FRIENDS] User ${username} is trying to accept or refuse friend request from ${friendRequest}. Got accept=${accept}`);

            if(accept === undefined || friendRequest === undefined){
                logger.warn(`[FRIENDS] ${friendRequest} and ${accept} are required`);
                res.status(400).json({ error: "friendRequest and accept are required" });
            }

            if(accept){
                await FriendsRepository.acceptNewFriend(friendRequest, username);
                logger.info(`[FRIENDS] Friend request accepted`);
            } else{
                await FriendsRepository.declineRelationshipRequest(friendRequest, username);
                logger.info(`[FRIENDS] Friend request refused`);
            }

            res.sendStatus(200);

        } catch (error) {
            logger.error(`Error accepting/refusing a friend request: ${error}.`);
            res.status(404).json({ error: "Not posible to access to the friends" });
        }
    });


export { friendRouter };
