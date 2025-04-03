import { Router } from "express";
 
import {
    protectRoute
} from "../middleware/auth.js";

import { SHOP_API , CategoryJSON} from "../api/restAPI.js";
import {UserRepository} from "../repositories/userRepository.js"
import { shopRepository } from "../repositories/shopRepository.js";

const shopRouter = Router();
shopRouter.use(protectRoute);

shopRouter
    .route(SHOP_API)

    // Obtain all the shops products for the user
    .get(async (req, res) => {
        try {
            
            const JSONResponse: { categories: CategoryJSON[] } = { categories: [] };

            const username = req.body.username;

            const categories = await shopRepository.obtainAllCategories();

            let isBought=false;
           
            for (const category of categories){

                const categoryJSON: CategoryJSON = {
                    name: category,
                    products: []
                };
                const products = await shopRepository.obtainProducts(category);
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
        } catch (error) {
            console.error("Error in delete:", error);
            res.status(400).json({ error: "You can not obtain the shop" });
        }
    })

    // Buy a new product
    .post(async (req, res) => {
        try {
            const username = req.body.username;
            const { categoryName, productName } = req.body.resp;
    
            if (!categoryName || !productName) {
                res.status(400).json({ error: "category_name and product_name are required" });
            }

            // Exist the product
            const productExists = await shopRepository.existProduct(productName, categoryName);
            if (!productExists) {
                res.status(404).json({ error: "Product not found" });
            }

            const productId = await shopRepository.obtainId(productName, categoryName);
            
            if(await shopRepository.isBought(productId, username)){
                res.status(400).json({ error: "You have just buy this product" });
            }

            // Obtain the coins
            const coins = await shopRepository.obtainCoinsProduct(productName, categoryName);

            // is valid the buy
            const hasEnoughCoins = await UserRepository.isEnoughCoins(coins, username);
            if (!hasEnoughCoins) {
                res.status(400).json({ error: "Not enough coins" });
            }

            // update coins
            await UserRepository.removeCoins(coins, username);

            // add product to the table
            await shopRepository.addProduct(productId, username);

            res.status(200).json({ message: "Product purchased successfully", userId: username });
        }
        catch (error) {
            console.error("Error in purchase:", error);
            res.status(500).json({ error: "Error buying the new product" });
        }
    });

export { shopRouter };
