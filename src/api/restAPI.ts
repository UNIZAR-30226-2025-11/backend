export const LOGIN_API: string = "/login";
export const REGISTER_API: string = "/register";
export const LOGOUT_API: string = "/logout";
export const USERS_API: string = "/users";
export const ID_API: string = "/id";
export const SHOP_API: string = "/shop";


export type CategoryJSON = {
    name: string;
    products: ProductJSON[];
}

export type ProductJSON = {
    name: string;
    price: number;
    isBought: boolean;
}
