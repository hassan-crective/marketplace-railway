import { Router } from "express";
import cartController from "../../controllers/cart.controller";
import { authenticateJWTId } from "../../middlewares/verifyid";
 

const cartRouter = Router();

cartRouter.post("/", cartController.create);
cartRouter.get("/", cartController.findAll);
cartRouter.get("/:id",cartController.getCartsByUserId);
cartRouter.delete("/productId/:id", authenticateJWTId,cartController.remove);
cartRouter.delete("/cardId/:id",authenticateJWTId, cartController.deletedCartById);

export default cartRouter;
