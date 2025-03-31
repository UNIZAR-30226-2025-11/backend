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
    .get(async (req, res) => {
        try {
            
            await shopRepository.initProducts();

            const userId = req.body.id;

            const JSON: CategoryJSON[] = [];

            const categories = await shopRepository.obtainAllCategories();

            let isBought=false;
           
            for (const category of categories){

                const categoryJSON: CategoryJSON = {
                    name: category,
                    products: []
                };

                const products = await shopRepository.obtainProducts(category);
                for(const product of products){

                    isBought = await shopRepository.isBought(product.productId, userId);

                    const productJSON: ProductJSON = {
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
            console.error("Error in delete:", error);
            res.status(400).json({ error: "You can not obtain the shop" });
        }
    })

    // Buy a new product
    .post(async (req, res) => {
        try {
            const userId = req.body.id;
            const { categoryName, productName } = req.body;
    
            if (!categoryName || !productName) {
                res.status(400).json({ error: "category_name and product_name are required" });
            }

            // Exist the product
            const productExists = await shopRepository.existProduct(productName, categoryName);
            if (!productExists) {
                res.status(404).json({ error: "Product not found" });
            }

            // Obtain the coins
            const coins = await shopRepository.obtainCoinsProduct(productName, categoryName);

            // is valid the buy
            const hasEnoughCoins = await UserRepository.isEnoughCoins(coins, userId);
            if (!hasEnoughCoins) {
                res.status(400).json({ error: "Not enough coins" });
            }

            // update coins
            await UserRepository.removeCoins(coins, userId);

            // add product to the table
            const productId = await shopRepository.obtainId(productName, categoryName);
            await shopRepository.addProduct(productId, userId);

            res.status(200).json({ message: "Product purchased successfully", userId });
        }
        catch (error) {
            console.error("Error in purchase:", error);
            res.status(500).json({ error: "Error buying the new product" });
        }
    });

export { shopRouter };
