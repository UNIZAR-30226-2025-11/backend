import { Router } from "express";
 
import {
    protectRoute
} from "../middleware/auth.js";

import { SHOP_API , CategoryJSON, ProductJSON} from "../api/restAPI.js";
import {UserRepository} from "../repositories/userRepository.js"
import { shopRepository } from "../repositories/shopRepository.js";

const shopRouter = Router();
shopRouter.use(protectRoute);

shopRouter
    .route(SHOP_API)

    // Obtain all the shops products for the user
    .get(async (_req, res) => {
        try {
            const userId = (_req as any).user.id;

            let JSON: CategoryJSON[] = [];

            let categories = await shopRepository.obtainAllCategories();

            let isBought=false;
           
            for (let category of categories){

                let categoryJSON: CategoryJSON = {
                    name: category,
                    products: []
                };

                let products = await shopRepository.obtainProducts(category);
                for(let product of products){

                    isBought = await shopRepository.isBought(product.product_id, userId);

                    let productJSON: ProductJSON = {
                        name: product.name,
                        price: product.price,
                        isBought: isBought
                    };
                    
                    categoryJSON.products.push(productJSON);
                }

                JSON.push(categoryJSON);
            }

            res.json(JSON);
        } catch (error) {
            res.status(400).json({ error: "You can not obtain the shop" });
        }
    })

    // Buy a new product
    .post(async (_req, res) => {
        try {
            const userId = (_req as any).user?.id;
            const { category_name, product_name } = _req.body;
    
            if (!category_name || !product_name) {
                res.status(400).json({ error: "category_name and product_name are required" });
            }

            // Exist the product
            const productExists = await shopRepository.existProduct(product_name, category_name);
            if (!productExists) {
                res.status(404).json({ error: "Product not found" });
            }

            // Obtain the coins
            const coins = await shopRepository.obtainCoinsProduct(product_name, category_name);

            // is valid the buy
            const hasEnoughCoins = await UserRepository.isEnoughCoins(coins, userId);
            if (!hasEnoughCoins) {
                res.status(400).json({ error: "Not enough coins" });
            }

            // update coins
            await UserRepository.removeCoins(coins, userId);

            // add product to the table
            const product_id = await shopRepository.obtainId(product_name, category_name);
            await shopRepository.addProduct(product_id, userId);

            res.status(200).json({ message: "Product purchased successfully", userId });
        }
        catch (error) {
            console.error("Error in purchase:", error);
            res.status(500).json({ error: "Error buying the new product" });
        }
    });

export { shopRouter };
