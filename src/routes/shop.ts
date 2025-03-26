import { Router } from "express";
 
import {
  protectRoute
} from "../middleware/auth.js";


const shopRouter = Router();
shopRouter.use(protectRoute);

shopRouter
  .route("/shop")

  // Obtain all the shops products for the user
  .get(async (_req, res) => {
    try {
        const userId = (_req as any).user.id;
    
        res.json(userId);
      } catch (error) {
        res.status(400).json({ error: "You can not obtain the shop" });
      }
  })

  // Buy a new product
  .post((_req, res) => {

    try {
        const userId = (_req as any).user.id;
        const { productId } = _req.body;
    
    
        res.status(200).json(productId);
      } catch (error) {
        res.status(400).json({ error: "Error buying the new product" });
      }
  });

export { shopRouter };
