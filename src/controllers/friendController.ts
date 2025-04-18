import { Socket } from "socket.io";
import logger from "../config/logger.js";
import { FriendManager } from "../managers/friendManager.js";
import { BackendResponseFriendRequestEnterLobbyJSON, BackendSendConnectedFriendsJSON, BackendSendFriendRequestEnterLobbyJSON, FriendSocketJSON, FrontendRequestConnectedFriendsJSON, FrontendResponseFriendRequestEnterLobbyJSON, FrontendSendFriendRequestEnterLobbyJSON } from "../api/socketAPI.js";
import { FrontendRequestConnectedFriendsJSONSchema, FrontendResponseFriendRequestEnterLobbyJSONSchema, FrontendSendFriendRequestEnterLobbyJSONSchema } from "../schemas/socketAPI.js";
import { SocketManager } from "../managers/socketManager.js";
import { LobbyManager } from "../managers/lobbyManager.js";
import { UserRepository } from "../repositories/userRepository.js";


export const setupFriendHandlers = (socket: Socket) => {

    socket.on("get-friends-connected", async (data: unknown, callback) => {
        
        const username: string = socket.data.user.username;

        logger.info(`User "${username}" sent "get-friends-connected" message`);
        logger.debug(`Received "get-friends-connected":\n%j`, data);

        const parsed = FrontendRequestConnectedFriendsJSONSchema.safeParse(data);

        if (!parsed.success) {
            logger.warn(`Invalid JSON: ${parsed.error}`);
            const msg = {
                error: true,
                errorMsg: `Error ${parsed.error} in data sent.`,
            };
            logger.debug(`Sending response "get-friends-connected":\t%j`, msg);
            callback(msg);
            return;
        }

        const request = parsed.data as FrontendRequestConnectedFriendsJSON;

        const friends: FriendSocketJSON[] =  await FriendManager.getConnectedFriends(username, request.lobbyId);
        
        const msg: BackendSendConnectedFriendsJSON = {
            error: false,
            errorMsg: "",
            connectedFriends: friends
        }

        logger.debug(`Sending "get-friends-connected" message:\n%j`, msg);

        callback(msg);
        
    });

    socket.on("send-friend-join-lobby-request", async (data: unknown, callback) => {
        logger.info(`User "${socket.data.user.username}" sent "send-friend-join-lobby-request" message`);
        logger.debug(`Received "send-friend-join-lobby-request":\n%j`, data);
        const username: string = socket.data.user.username;

        const parsed = FrontendSendFriendRequestEnterLobbyJSONSchema.safeParse(data);

        if (!parsed.success) {
            logger.warn(`Invalid JSON: ${parsed.error}`);
            const msg = {
                error: true,
                errorMsg: `Error ${parsed.error} in data sent.`,
            };
            logger.debug(`Sending response "send-friend-join-lobby-request":\t%j`, msg);
            callback(msg);
            return;
        }

        const friendJoinLobbyRequest = parsed.data as FrontendSendFriendRequestEnterLobbyJSON;

        const lobbyId: string = friendJoinLobbyRequest.lobbyId;
        const friendUsername: string = friendJoinLobbyRequest.friendUsername;
        const areFriends: boolean = await FriendManager.isFriend(username, friendUsername);
        if (!areFriends) {
            logger.warn(`User "${username}" is not friends with "${friendUsername}"`);
            const msg = {
                error: true,
                errorMsg: `User "${username}" is not friends with "${friendUsername}"`,
            };
            logger.debug(`Sending response "send-friend-join-lobby-request":\t%j`, msg);
            callback(msg);
            return;
        }

        if(!SocketManager.hasSocket(friendUsername)) {
            logger.warn(`User "${friendUsername}" is not connected`);
            const msg = {
                error: true,
                errorMsg: `User "${friendUsername}" is not connected`,
            };
            logger.debug(`Sending response "send-friend-join-lobby-request":\t%j`, msg);
            callback(msg);
            return;
        }

        if(!await LobbyManager.lobbyExists(lobbyId)) {
            logger.warn(`Lobby "${lobbyId}" does not exist`);
            const msg = {
                error: true,
                errorMsg: `Lobby "${lobbyId}" does not exist`,
            };
            logger.debug(`Sending response "send-friend-join-lobby-request":\t%j`, msg);
            callback(msg);
            return;
        }

        const isInLobby: boolean = await LobbyManager.getLobbyWithPlayer(friendUsername) !== undefined;

        if(isInLobby) {
            logger.warn(`User "${friendUsername}" is already in a lobby`);
            const msg = {
                error: true,
                errorMsg: `User "${friendUsername}" is already in a lobby`,
            };
            logger.debug(`Sending response "send-friend-join-lobby-request":\t%j`, msg);
            callback(msg);
            return;
        }

        const avatar: string = await UserRepository.getAvatar(username);


        const socketFriend: Socket | undefined = SocketManager.getSocket(friendUsername);

        if(socketFriend === undefined) {
            logger.warn(`Socket for user "${friendUsername}" not found`);
            const msg = {
                error: true,
                errorMsg: `Socket for user "${friendUsername}" not found`,
            };
            logger.debug(`Sending response "send-friend-join-lobby-request":\t%j`, msg);
            callback(msg);
            return;
        }

        const msg: BackendSendFriendRequestEnterLobbyJSON = {
            error: false,
            errorMsg: "",
            lobbyId: lobbyId,
            friendSendingRequest: username,
            friendSendingRequestAvatar: avatar,
        }
        logger.info(`Sending "receive-friend-join-lobby-request" message to ${friendUsername}`);
        logger.debug(`Sending "receive-friend-join-lobby-request" message to ${friendUsername}:\n%j`, msg);
        socketFriend.emit("receive-friend-join-lobby-request", msg);

        logger.verbose(`Waiting for response from "${friendUsername}"`);
        socketFriend.once("receive-friend-join-lobby-request", async (msg2: unknown) => {
            
            logger.info(`User "${friendUsername}" sent "response-friend-join-lobby-request" message`);
            logger.debug(`Received "response-friend-join-lobby-request":\n%j`, msg2);
            const parsedMsg2 = FrontendResponseFriendRequestEnterLobbyJSONSchema.safeParse(msg2);


            if (!parsed.success) {
                logger.warn(`Invalid JSON: ${parsedMsg2.error}.`);
                logger.debug(`Sending response "send-friend-join-lobby-request" to ${username}:\t%j`, msg);
                callback({
                    error: true,
                    errorMsg: `Error ${parsedMsg2.error} in data sent.`,
                });
                return;
            }

            const response = parsedMsg2.data as FrontendResponseFriendRequestEnterLobbyJSON;

            if(response.accept){
                if (!await LobbyManager.joinLobby(friendUsername, response.lobbyId)) {

                    logger.debug(`Sending response "send-friend-join-lobby-request" to ${username}:\t%j`, response);
        
                    callback({
                        error: true,
                        errorMsg: `Error joining lobby ${response.lobbyId}`,
                    });
                    return;
                }
            }

            const msgBack: BackendResponseFriendRequestEnterLobbyJSON = {
                error: false,
                errorMsg: "",
                lobbyId: lobbyId,
                friendUsername: friendUsername,
                accept: response.accept,
            };

            logger.debug(`Sending response "send-friend-join-lobby-request" to ${username}:\t%j`, msg);
            callback(msgBack);
        });
      
    });

};