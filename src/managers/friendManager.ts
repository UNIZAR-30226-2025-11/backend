import { FriendsJSON } from "../api/restAPI.js";
import { FriendSocketJSON } from "../api/socketAPI.js";
import { FriendsRepository } from "../repositories/friendsRepository.js";
import { LobbyManager } from "./lobbyManager.js";
import { SocketManager } from "./socketManager.js";


export class FriendManager {

    static async getConnectedFriends(username: string, lobbyId: string): Promise<FriendSocketJSON[]> {
        const allFriends: FriendsJSON[] = await FriendsRepository.obtainFriends(username);
        const connectedFriends: FriendSocketJSON[] = await Promise.all(allFriends.map(async friend => {
            console.log(friend.username);
            const lobbyInGame: string | undefined = await LobbyManager.getLobbyWithPlayer(friend.username);
            const connected: boolean = SocketManager.hasSocket(friend.username);
            const isAlreadyInThisLobby: boolean = lobbyInGame === lobbyId;
            return {
                username: friend.username,
                avatar: friend.avatar,
                connected: connected,
                isInGame: lobbyInGame !== undefined,
                isAlreadyInThisLobby: isAlreadyInThisLobby,
            };
        }));
        return connectedFriends;
    }

    static async isFriend(username: string, friendUsername: string): Promise<boolean> {
        const friends: FriendsJSON[] = await FriendsRepository.obtainFriends(username);
        return friends.some(friend => friend.username === friendUsername);
    }
}