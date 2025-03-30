import { db } from "../db.js";
import crypto from "node:crypto";
import logger from "../config/logger.js";


export class shopRepository {
    /**
     * Initializes the products in the database if they do not already exist.
     * This function checks if there are any existing products in the 'products' table. 
     * If no products are found, it inserts a set of default products into the table.
     *
     * @returns {Promise<void>} A promise that resolves when the product initialization process is complete.
     *                          It does not return any value but logs the status of the operation.
     *                          In case of an error during the initialization, the error is logged.
     */
    static async initProducts () {
        try {
            // Verifica si ya existen productos en la base de datos
            const result = await db.query("SELECT COUNT(*) FROM shop_products");
            const productCount = parseInt(result.rows[0].count);
    
            if (productCount === 0) {
                // Si no hay productos, insertamos los productos iniciales
                await db.query(`
                    INSERT INTO shop_products (product_id,name, category, price) VALUES
                    (0,'HairyCat', 'Avatar', 500),
                    (1,'PotatoCat', 'Avatar', 1000),
                    (2, 'BeardCat', 'Avatar', 1500),
                    (3, 'Blue', 'Background', 300),
                    (4, 'Yellow', 'Background', 600)
                `);
            } 
        } catch (error) {
            console.error("Error initializing products:", error);
        }
    };

     /**
     * Retrieves the price of a product based on its name and category.
     *
     * @param {string} product_name - The name of the product.
     * @param {string} category_name - The name of the category to which the product belongs.
     * @returns {Promise<number>} A promise that resolves to the price of the product.
     *                            Throws an error if the product is not found.
     */
    static async obtainCoinsProduct(
        product_name: string,
        category_name: string
    ) : Promise<number> {
        try {
            const res = await db.query(
                `
                SELECT price 
                FROM shop_products
                WHERE category=$1 and name=$2
                `, [category_name, product_name]);
            if (res.rows.length > 0) {
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
     * @param {string} product_name - The name of the product.
     * @param {string} category_name - The name of the category to which the product belongs.
     * @returns {Promise<number>} A promise that resolves to the product ID.
     *                            Throws an error if the product is not found.
     */
    static async obtainId(
        product_name: string,
        category_name: string
    ) : Promise<number>{
        try {
            const res = await db.query(
                `
                SELECT product_id 
                FROM shop_products
                WHERE category=$1 and name=$2
                `, [category_name, product_name]);
            if (res.rows.length > 0) {
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
     * @param {number} product_id - The ID of the product to be added.
     * @param {crypto.UUID} user_id - The ID of the user to whom the product will be added.
     * @returns {Promise<void>} A promise that resolves when the product is successfully added to the user's list.
     *                          Logs an error if the insertion fails.
     */
    static async addProduct(
        product_id: number,
        user_id: crypto.UUID,
    ){
        try {
            const res = await db.query(
                `
                INSERT INTO user_products (id_user, id_product)
                VALUES ($2, $1)
                `,[product_id, user_id]);

        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

    /**
     * Checks whether a product exists in the database based on its name and category.
     *
     * @param {string} product_name - The name of the product to check.
     * @param {string} category_name - The name of the category to which the product belongs.
     * @returns {Promise<boolean>} A promise that resolves to `true` if the product exists, 
     *                            or `false` if it does not exist.
     */
    static async existProduct(
        product_name: string,
        category_name: string
    ) : Promise<boolean>{

        try {
            const res = await db.query(
                `
                SELECT price 
                FROM shop_products
                WHERE category=$1 and name=$2
                `, [category_name, product_name]);
            if (res.rows.length > 0) {
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
            const res = await db.query(
                `
                SELECT DISTINCT category 
                FROM shop_products
                `);
            if (res.rows.length > 0) {
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
    ) : Promise<{ name: string, price: number, product_id: number }[]>{
        try {
            const res = await db.query(
                `
                SELECT name, price, product_id
                FROM shop_products
                WHERE category=$1
                `,[category]);

            if (res.rows.length > 0) {
               
                return res.rows.map(row => ({
                    name: row.name,
                    price: row.price,
                    product_id: row.product_id
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
     * @param {crypto.UUID} userId - The ID of the user to check.
     * @returns {Promise<boolean>} A promise that resolves to `true` if the product has been bought by the user,
     *                             or `false` if it has not been bought.
     */
    static async isBought(
        productId: number,
        userId: crypto.UUID
    ) : Promise<boolean>{
        try {
        const res = await db.query(
            `
            SELECT id_user
            FROM user_products
            WHERE product_id=$2 and user_id=$1)
            `,[productId, userId]);
        
            if (res.rows.length > 0) {
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


  