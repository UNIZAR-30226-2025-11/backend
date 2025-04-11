import { Router } from "express";
 
import {
    protectRoute
} from "../middleware/auth.js";

import { SHOP_API , CategoryJSON } from "../api/restAPI.js";
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
            
            const JSONResponse: { categories: CategoryJSON[] } = { categories: [] };

            const username : string = req.body.username;

            const categories : string[] = await shopRepository.obtainAllCategories();

            let isBought : boolean = false;
           
            for (const category of categories){

                const categoryJSON: CategoryJSON = {
                    name: category,
                    products: []
                };
                const products : {
                    name: string;
                    price: number;
                    productId: number;
                }[] = await shopRepository.obtainProducts(category);
                for(const product of products){

                    isBought = await shopRepository.isBought(product.productId, username);
                    
                    categoryJSON.products.push({
                        name: product.name,
                        price: product.price,
                        isBought: isBought
                    });
                    
                }

                JSONResponse.categories.push(categoryJSON);
            }
           
            res.json({categories: JSONResponse});
            logger.info(`[SHOP] All shop send`);
        } catch (error) {
            logger.error(`Error in delete: ${error}`);
            res.status(400).json({ error: "You can not obtain the shop" });
        }
    })

    // Buy a new product
    .post(async (req, res) => {
        try {
            const username : string = req.body.username;
            const { categoryName, productName } = req.body.resp;
    
            if (!categoryName || !productName) {
                logger.warn(`[SHOP] ${categoryName} and ${productName} are required`);
                res.status(400).json({ error: "category_name and product_name are required" });
            }

            // Exist the product
            const productExists : boolean = await shopRepository.existProduct(productName, categoryName);
            if (!productExists) {
                logger.warn(`[SHOP] ${categoryName} and ${productName} not exist`);
                res.status(404).json({ error: "Product not found" });
            }

            const productId : number = await shopRepository.obtainId(productName, categoryName);
            
            if(await shopRepository.isBought(productId, username)){
                logger.warn(`[SHOP] ${categoryName} and ${productName} just buy for the user`)
                res.status(400).json({ error: "You have just buy this product" });
            }

            // Obtain the coins
            const coins : number = await shopRepository.obtainCoinsProduct(productName, categoryName);

            // update coins
            await UserRepository.removeCoins(coins, username);

            // add product to the table
            await shopRepository.addProduct(productId, username);

            logger.info(`[SHOP] The product ${categoryName} and ${productName} has been bought`)
            res.status(200).json({ message: "Product purchased successfully", userId: username });
        }
        catch (error) {
            logger.error(`Error in purchase: ${error}`);
            res.status(500).json({ error: "Error buying the new product" });
        }
    });

export { shopRouter };