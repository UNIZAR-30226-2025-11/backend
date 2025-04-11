import { db } from "../db.js";
import logger from "../config/logger.js";


export class shopRepository {
  
     /**
     * Retrieves the price of a product based on its name and category.
     *
     * @param {string} productName - The name of the product.
     * @param {string} categoryName - The name of the category to which the product belongs.
     * @returns {Promise<number>} A promise that resolves to the price of the product.
     *                            Throws an error if the product is not found.
     */
    static async obtainCoinsProduct(
        productName: string,
        categoryName: string
    ) : Promise<number> {
        try {
            logger.silly(`[DB] AWAIT: Obtaining coins of the product`);
            const res = await db.query(
                `
                SELECT price 
                FROM shop_products
                WHERE category=$1 and name=$2
                `, [categoryName, productName]);
            if (res.rows.length > 0) {
                logger.silly(`[DB] DONE: Got coins`);
                return res.rows[0].price;
            } else {
                logger.error("[DB] Error in database.");
                throw new Error("Error in database");
            }
        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

    /**
     * Retrieves the product ID based on its name and category.
     *
     * @param {string} productName - The name of the product.
     * @param {string} categoryName - The name of the category to which the product belongs.
     * @returns {Promise<number>} A promise that resolves to the product ID.
     *                            Throws an error if the product is not found.
     */
    static async obtainId(
        productName: string,
        categoryName: string
    ) : Promise<number>{
        try {
            logger.silly(`[DB] AWAIT: Getting id of the product`);
            const res = await db.query(
                `
                SELECT product_id 
                FROM shop_products
                WHERE category=$1 and name=$2
                `, [categoryName, productName]);
            if (res.rows.length > 0) {
                logger.silly(`[DB] DONE: Got id of the product`);
                return res.rows[0].product_id;
            } else {
                logger.error("[DB] Error in database.");
                throw new Error("Error in database");
            }
        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

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
    static async existProduct(
        productName: string,
        categoryName: string
    ) : Promise<boolean>{

        try {
            logger.silly(`[DB] AWAIT: Getting if exist one product`);
            const res = await db.query(
                `
                SELECT price 
                FROM shop_products
                WHERE category=$1 and name=$2
                `, [categoryName, productName]);
            if (res.rows.length > 0) {
                logger.silly(`[DB] DONE: Got the product`);
                return true;
            } else {
                return false;
            }
        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }

    }

    /**
     * Retrieves a list of distinct categories from the database.
     *
     * @returns {Promise<string[]>} A promise that resolves to an array of category names.
     *                              Returns an empty array if no categories are found.
     */
    static async obtainAllCategories() : Promise<string[]>{
        try {
            logger.silly(`[DB] AWAIT: Obtaining all the categories`);
            const res = await db.query(
                `
                SELECT DISTINCT category 
                FROM shop_products
                `);
            if (res.rows.length > 0) {
                logger.silly(`[DB] DONE: Categories has been obtained`);
                // Usamos map para extraer solo los valores de la columna 'category'
                return res.rows.map(row => row.category);
            } else {
                return [];  // Si no hay categorías, devolvemos un arreglo vacío
            }
        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }

    }

     /**
     * Retrieves all products for a given category from the database.
     *
     * @param {string} category - The name of the category for which to retrieve products.
     * @returns {Promise<{ name: string, price: number, product_id: number }[]>} 
     * A promise that resolves to an array of product objects, each containing `name`, `price`, and `product_id`.
     * Returns an empty array if no products are found for the category.
     */
     static async obtainProducts(
        category: string
    ) : Promise<{ name: string, price: number, productId: number }[]>{
        try {
            logger.silly(`[DB] AWAIT: Obtaining info for the product`);
            const res = await db.query(
                `
                SELECT name, price, product_id
                FROM shop_products
                WHERE category=$1
                `,[category]);

            if (res.rows.length > 0) {
               
                logger.silly(`[DB] DONE: Got info of the product`);
                return res.rows.map(row => ({
                    name: row.name,
                    price: row.price,
                    productId: row.product_id
                }));
            } else {
                return []; 
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
                logger.silly(`[DB] DONE: Got bought status ${productId} for ${username}`);
                return true;
            } else {
                return false; 
            }
        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }
    
}


  
