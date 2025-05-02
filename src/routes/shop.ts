import { Router } from "express";
 
import {
    protectRoute
} from "../middleware/auth.js";

import { SHOP_API , CategoryJSON, RawProduct, ProductJSON, ProductOwned, SHOP_OWNED_API } from "../api/restAPI.js";
import { UserRepository } from "../repositories/userRepository.js"
import { shopRepository } from "../repositories/shopRepository.js";
import logger from "../config/logger.js";

const shopRouter = Router();
shopRouter.use(protectRoute);

shopRouter
    .route(SHOP_API)

    // Obtain all the shops products for the user
    .get(async (req, res) => {
        try {

            logger.info(`[SHOP] Getting all shop products`);

            const username : string = req.body.username;

            logger.debug(`[SHOP] User ${username} is trying to obtain the shop`);

            const products : RawProduct[] = await shopRepository.getAllRawProducts();

            const getBoughtProducts: Map<number, boolean> = await shopRepository.getBoughProducts(username);

            const JSONResponse : CategoryJSON[] = products.reduce((acc: CategoryJSON[], product: RawProduct) => {
                const { categoryName, categoryUrl, productName, productUrl, id, price } = product;
                const isBought : boolean = getBoughtProducts.get(id) || false;

                // Check if the category already exists in the accumulator
                let category = acc.find((cat) => cat.name === categoryName);
                if (!category) {
                    // If not, create a new category and add it to the accumulator
                    category = { name: categoryName, url: categoryUrl, products: [] };
                    acc.push(category);
                }

                // Add the product to the corresponding category
                const newProduct : ProductJSON = { name: productName, url: productUrl, price: price, isBought: isBought };
                category.products.push(newProduct);

                return acc;
            }, []);
           
            res.json({categories: JSONResponse});
            logger.info(`[SHOP] All shop send`);
        } catch (error) {
            logger.error(`Error in delete: ${error}`);
            res.status(404).json({ error: "You can not obtain the shop" });
        }
    })

    // Buy a new product
    .post(async (req, res) => {
        try {
            const username : string = req.body.username;
            const { categoryName, productName } = req.body.resp;
    
            if (categoryName === undefined || productName === undefined) {
                logger.warn(`[SHOP] ${categoryName} and ${productName} are required`);
                res.status(400).json({ error: "category_name and product_name are required" });
            }

            // Get the product id
            const product : {id: number, price: number} | undefined = await shopRepository.getProductIdAndCoins(productName, categoryName);
            if (product === undefined) {
                logger.warn(`[SHOP] ${categoryName} and ${productName} not exist`);
                res.status(400).json({ error: "Product not found" });
                return;
            }
            
            if (await shopRepository.isBought(product.id, username)) {
                logger.warn(`[SHOP] ${username} already bought the product ${categoryName} and ${productName}`);
                res.status(400).json({ error: "Product already bought" });
                return;
            }

            const currentCoins: number = await UserRepository.getCoins(username);
            if (currentCoins < product.price) {
                logger.warn(`[SHOP] ${username} does not have enough coins`);
                res.status(400).json({ error: "Not enough coins" });
                return;
            }

            
            if (!await UserRepository.updateCoins(username, currentCoins - product.price))
            {
                logger.warn(`[SHOP] Error updating coins for ${username}`);
                res.status(400).json({ error: "User not found" });
                return;
            }

            // add product to the table
            await shopRepository.addProduct(product.id, username);

            logger.info(`[SHOP] The product ${categoryName} and ${productName} has been bought`)
            res.status(200).json({ message: "Product purchased successfully", userId: username });
        }
        catch (error) {
            logger.error(`Error in purchase: ${error}`);
            res.status(404).json({ error: "Error buying the new product" });
        }
    });

shopRouter
    .route(SHOP_OWNED_API)

    .get(async (req, res) => {
        try {

            const username : string = req.body.username;
            logger.info(`[SHOP] Getting all owned products`);

            // Get all owned products of the user and the category
            const products : ProductOwned[] = await shopRepository.getOwnedProducts(username);

            res.status(200).json({ products:products });
            logger.info(`[SHOP] All owned products send.`);
        }
        catch (error) {
            logger.error(`Error in purchase: ${error}`);
            res.status(404).json({ error: "Error buying the new product" });
        }
    })

    // To change the selected product in the category
    .put(async (req, res) => {
        try {
            const username : string = req.body.username;
            const { categoryName, productName } = req.body.resp;

            logger.info(`[SHOP] ${username} is trying to change the category ${categoryName} item to the product ${productName}`);
    
            if (!categoryName || !productName) {
                logger.warn(`[SHOP] ${categoryName} and ${productName} are required`);
                res.status(400).json({ error: "category_name and product_name are required" });
            }

            // Get the product id
            const product : {id: number, price: number} | undefined = await shopRepository.getProductIdAndCoins(productName, categoryName);
            if (product === undefined) {
                logger.warn(`[SHOP] ${categoryName} and ${productName} not exist`);
                res.status(400).json({ error: "Product not found" });
                return;
            }

            const productId: number = product.id;
            
            if (!await shopRepository.isBought(productId, username)) {
                logger.warn(`[SHOP] ${username} do not own the item of category ${categoryName} and product ${productName}`);
                res.status(400).json({ error: "Product not bought" });
                return;
            }

            const currentCategoryProductName: string = await shopRepository.getCategoryProductName(categoryName, username);

            if (currentCategoryProductName === productName) {
                logger.warn(`[SHOP] ${username} already is wearing the product ${productName} in the category ${categoryName}`);
            }

            await shopRepository.updateCategoryProductName(categoryName, username, productName);
            logger.info(`[SHOP] The product ${categoryName} and ${productName} has been changed`)
            res.sendStatus(200);

        }
        catch (error) {
            logger.error(`Error in purchase: ${error}`);
            res.status(404).json({ error: "Error buying the new product" });
        }
    })

export { shopRouter };
