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
                    INSERT INTO products (name, category_name, price) VALUES
                    ('HairyCat', 'Avatar', 500),
                    ('PotatoCat', 'Avatar', 1000),
                    ('BeardCat', 'Avatar', 1500),
                    ('Blue', 'Background', 300),
                    ('Yellow', 'Background', 600);
                `);
            } 
        } catch (error) {
            console.error("Error initializing products:", error);
        }
    };


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

    static async addProduct(
        product_id: number,
        user_id: crypto.UUID,
    ){
        try {
            const res = await db.query(
                `
                INSERT INTO user_products (id_user, id_product)
                VALUES ($2, $1);
                `,[product_id, user_id]);

        } catch (error) {
            logger.error("[DB] Error in database.", error);
            throw new Error("Error in database");
        }
    }

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

    static async isBought(
        productId: number,
        userId: crypto.UUID
    ) : Promise<boolean>{
        try {
        const res = await db.query(
            `
            SELECT id_user
            FROM user_products
            WHERE product_id=$2 and user_id=$1);
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


  