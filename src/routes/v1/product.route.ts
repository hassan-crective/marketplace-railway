import { Router } from "express";
import productController, { updatePublisherProductController } from "../../controllers/product.controller";
import { Others } from "../../enums/others.enum";
import { authorizeRole } from "../../middlewares/role.middleware";
import { authenticateJWT } from "../../middlewares/auth.middleware";

const productRouter = Router();

productRouter.post("/create/product", authenticateJWT,authorizeRole(Others.role.PUBLISHER) , productController.createProduct);
productRouter.get("/products", authenticateJWT,authorizeRole(Others.role.PUBLISHER), productController.getProducts);
productRouter.put("/update/product/:id",authenticateJWT ,authorizeRole(Others.role.PUBLISHER), productController.updateProduct);
productRouter.delete("/delete/product/:productId",authenticateJWT , authorizeRole(Others.role.PUBLISHER), productController.deleteProducts);
productRouter.post("/submit-post/:id", authenticateJWT, authorizeRole(Others.role.PUBLISHER), productController.submitPost);
productRouter.get('/products/postPending', authenticateJWT, authorizeRole(Others.role.PUBLISHER), productController.getPendingProducts);
// user get all products
productRouter.get("/get/products",   productController.getAllProductsUsers);
productRouter.get("/products/unapproved",authenticateJWT,authorizeRole(Others.role.PUBLISHER, Others.role.MODERATOR),productController.getUnapprovedProducts);
productRouter.put("/admin-update/:productId", authenticateJWT, updatePublisherProductController);

export default productRouter;