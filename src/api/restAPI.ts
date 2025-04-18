export const LOGIN_API: string = "/login";
export const REGISTER_API: string = "/register";
export const LOGOUT_API: string = "/logout";
export const USERS_API: string = "/users";
export const SHOP_API: string = "/shop";
export const FRIENDS_API: string = "/friends";
export const ALL_USERS: string = "/users";
export const FRIENDS_REQ: string = "/friends/request";
export const USER_API: string = "/user";
export const ID_API: string = "/id";


export type RawProduct = {
    productName: string;
    productUrl: string;
    categoryName: string;
    categoryUrl: string;

    id: number;
    price: number;
};


export type CategoryJSON = {
    name: string;
    url: string;
    products: ProductJSON[];
}

export type ProductJSON = {
    name: string;
    url: string;
    price: number;
    isBought: boolean;
}

export type FriendsJSON = {
    username: string;
    avatar: string;
    isAccepted: boolean;
}

export type UserAvatarJSON = {
    username: string;
    avatar: string;
}


export type UserJSON = {
    username: string;
    coins: number;
    statistics: StatisticsJSON;
    userPersonalizeData: UserPersonalizeDataJSON;
}

export type StatisticsJSON = {
    gamesPlayed: number;
    gamesWon: number;
    currentStreak: number;
    bestStreak: number;
    totalTimePlayed: number;
    totalTurnsPlayed: number;
    lastFiveGames: RecordJSON[];
}

export type UserPersonalizeDataJSON = {
    avatar: string;
    background: string;
}

export type RecordJSON = {
    gameDate: Date;
    isWinner: boolean;
    lobbyId: string;
}
