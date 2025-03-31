export const LOGIN_API: string = "/login";
export const REGISTER_API: string = "/register";
export const LOGOUT_API: string = "/logout";
export const USERS_API: string = "/users";
export const ID_API: string = "/id";
export const SHOP_API: string = "/shop";
export const FRIENDS_API: string = "/friends";
export const ALL_USERS: string = "/users";
export const FRIENDS_REQ: string = "/friends/request";
export const USER_API: string = "/user";


export type CategoryJSON = {
    name: string;
    products: ProductJSON[];
}

export type ProductJSON = {
    name: string;
    price: number;
    isBought: boolean;
}

export type FriendsJSON = {
    username: string;
    avatar: string;
}