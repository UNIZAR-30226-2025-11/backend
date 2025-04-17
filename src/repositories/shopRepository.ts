import { db } from "../db.js";
import logger from "../config/logger.js";
import { RawProduct } from "../api/restAPI.js";
import camelcaseKeys from "camelcase-keys";


export class shopRepository {
  
    /**
     * Adds a product to a user's product list in the 'user_products' table.
     *
     * @param {number} productId - The ID of the product to be added.
     * @param {string} username - The ID of the user to whom the product will be added.
     * @returns {Promise<void>} A promise that resolves when the product is successfully added to the user's list.
     *                          Logs an error if the insertion fails.
     */
    static async addProduct(
        productId: number,
        username: string,
    ){
        try {
            logger.silly(`[DB] AWAIT: Adding the product to the user`);
            await db.query(
                `
                INSERT INTO user_products (username, id_product)
                VALUES ($2, $1)
                `,[productId, username]);
            
                logger.silly(`[DB] DONE: Add the product`);
        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

    /**
     * Checks whether a product exists in the database based on its name and category.
     *
     * @param {string} productName - The name of the product to check.
     * @param {string} categoryName - The name of the category to which the product belongs.
     * @returns {Promise<boolean>} A promise that resolves to `true` if the product exists, 
     *                            or `false` if it does not exist.
     */
    static async getProductIdAndCoins(
        productName: string,
        categoryName: string
    ) : Promise<{id: number, price: number} | undefined>{

        try {
            logger.silly(`[DB] AWAIT: Getting product id and price for ${categoryName}-${productName}`);
            const res = await db.query(
                `
                SELECT id, price
                FROM shop_products
                WHERE category_url=$1 and product_url=$2
                `, [categoryName, productName]);
            if (res.rows.length > 0) {
                logger.silly(`[DB] DONE: Got the product`);
                return {id: res.rows[0].id, price: res.rows[0].price};
            } else {
                return undefined;
            }
        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }

    }

    /**
     * Checks if a product has been purchased by a user.
     *
     * @param {number} productId - The ID of the product to check.
     * @param {crypto.UUID} username - The ID of the user to check.
     * @returns {Promise<boolean>} A promise that resolves to `true` if the product has been bought by the user,
     *                             or `false` if it has not been bought.
     */
    static async isBought(
        productId: number,
        username: string
    ) : Promise<boolean>{
        try {
            logger.silly(`[DB] AWAIT: Getting if a product has been bought for a user`);
            const res = await db.query(
                `
                SELECT username
                FROM user_products
                WHERE id_product=$1 and username=$2
                `,[productId, username]);
        
            if (res.rows.length > 0) {
                logger.silly(`[DB] DONE: Product ${productId} bought for ${username}`);
                return true;
            } else {
                logger.silly(`[DB] DONE: Product ${productId} not bought for ${username}`);
                return false; 
            }
        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }
    

    static async getAllRawProducts() : Promise<RawProduct[]> {
        try {
            logger.silly(`[DB] AWAIT: Obtaining all the products`);
            const res = await db.query(
                `
                SELECT * 
                FROM shop_products
                `);
            if (res.rows.length > 0) {
                logger.silly(`[DB] DONE: Products has been obtained`);
                return camelcaseKeys(res.rows, {deep: true}) as RawProduct[];
            } else {
                logger.warn(`[DB] No products found`);
                return []; // Return an empty array if no products are found 
            }
        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

    static async getBoughProducts(username: string) : Promise<Map<number, boolean>> {
        try {
            logger.silly(`[DB] AWAIT: Obtaining bought products`);
            const res = await db.query(
                `
                SELECT id, (username is NOT NULL) as bought
                FROM shop_products 
                LEFT JOIN user_products 
                ON (
                    shop_products.id = user_products.id_product 
	                AND user_products.username = $1
                );
                `,[username]);
            if (res.rows.length > 0) {
                logger.silly(`[DB] DONE: Products has been obtained`);
                
                const productMap = new Map<number, boolean>();
            
                res.rows.forEach(row => {
                    productMap.set(row.id, row.bought);
                });

                return productMap;
            } else {
                logger.warn(`[DB] No products found`);
                return new Map();
            }
        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }
}


  
