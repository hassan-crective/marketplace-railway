import { Router } from "express";
import UserController  from "../../controllers/affliate.controller";
import { authenticateJWT } from "../../middlewares/auth.middleware";
import { authorizeRole } from "../../middlewares/role.middleware";
import { Others } from "../../enums/others.enum";

const affliateRouter = Router();

affliateRouter.put("/request-affiliate", authenticateJWT,authorizeRole(Others.role.PUBLISHER), UserController.requestAffiliate);
affliateRouter.get("/get/affiliate-info", authenticateJWT,authorizeRole(Others.role.ADMIN , Others.role.SUPERADMIN , Others.role.MODERATOR), UserController.fetchAffiliateUsers);
affliateRouter.put("/approve/reject/affiliate/:id", authenticateJWT,authorizeRole(Others.role.ADMIN , Others.role.SUPERADMIN)  , UserController.approveOrRejectAffiliate);
affliateRouter.patch("/affiliate/:id", authenticateJWT,authorizeRole(Others.role.ADMIN , Others.role.SUPERADMIN , Others.role.MODERATOR), UserController.removeAffiliateUser);
export default affliateRouter;
