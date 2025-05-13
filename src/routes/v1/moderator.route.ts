import { Router } from "express";
import  moderatorController  from "../../controllers/moderator.controller";
import moderatorControllers from "../../controllers/product.controller";
import { authorizeRole } from "../../middlewares/role.middleware";
import { Others } from "../../enums/others.enum";
import { authenticateJWT } from "../../middlewares/auth.middleware";
import { checkPermission } from "../../middlewares/permission.middleware";
const moderatorRouter = Router();


moderatorRouter.post("/create/product", authenticateJWT,authorizeRole(Others.role.MODERATOR) ,checkPermission(["add_product"]), moderatorControllers.createProduct);
moderatorRouter.get("/products", authenticateJWT,authorizeRole(Others.role.MODERATOR),checkPermission(["view_products"]), moderatorControllers.getProducts);
moderatorRouter.put("/update/product/:id",authenticateJWT ,authorizeRole(Others.role.MODERATOR),checkPermission(["update_products"]), moderatorControllers.updateProduct);
moderatorRouter.delete("/delete/product/:productId",authenticateJWT , authorizeRole(Others.role.MODERATOR),checkPermission(["delete_product"]), moderatorControllers.deleteProducts);
moderatorRouter.post("/submit-post/:id", authenticateJWT, authorizeRole(Others.role.MODERATOR), moderatorControllers.submitPost);
moderatorRouter.get('/products/postPending', authenticateJWT, authorizeRole(Others.role.MODERATOR), moderatorControllers.getPendingProducts);
moderatorRouter.get("/products/unapproved",authenticateJWT,authorizeRole( Others.role.MODERATOR),checkPermission(["view_pending_products"]),moderatorControllers.getUnapprovedProducts);
moderatorRouter.get(
    "/publishers",
    authorizeRole(Others.role.SUPERADMIN, Others.role.ADMIN, Others.role.MODERATOR), 
    moderatorController.fetchPublishers
  );
  
 export default moderatorRouter; 