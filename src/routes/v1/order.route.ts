import { authenticateJWTId } from "./../../middlewares/verifyid";

import { Router } from "express";
import orderController, { adminUpdateOrderPaymentStatus } from "../../controllers/order.controller";
import { authenticateJWT } from "../../middlewares/auth.middleware";
import { authorizeRole } from "../../middlewares/role.middleware";
import { Others } from "../../enums/others.enum";
import { authenticateJWTIdbyRole } from "../../middlewares/roleid";
import { authorizeRoleBase } from "../../middlewares/roleAdmin";

const orderRoute = Router();

orderRoute.get("/", authenticateJWTId, orderController.findAll);
orderRoute.get("/publisher", authenticateJWTId, orderController.getPublisherOrdersHandler);
orderRoute.post("/", authenticateJWTId, orderController.createOrderHandler);
orderRoute.get("/admin", orderController.findAllOrdes);
orderRoute.post("/conten-provider", authenticateJWTId, orderController.requestOrderToPublisherHandler);
orderRoute.get("/:id", orderController.getOrderById);
orderRoute.put("/accepted/:id", authenticateJWTId, orderController.orderAccepted);
orderRoute.put("/rejected/:id", authenticateJWTId, orderController.orderRejected);
orderRoute.put("/submit/:id", authenticateJWTId, orderController.orderSubmited);
orderRoute.put("/updateOrder/:id", orderController.orderStatusUpdate);
orderRoute.put("/superadmin-accept-order/:orderId", authenticateJWTId, orderController.SuperAdminAccepted);
orderRoute.put("/status/updateById/:orderId", authenticateJWTId, orderController.orderStatusUpdateById);
orderRoute.put(
  "/rejectedAdmin/:id",
  authenticateJWTIdbyRole,
  authorizeRoleBase(Others.role.ADMIN, Others.role.SUPERADMIN),
  orderController.SuperAdminRejected
);
orderRoute.post("/call-Back", orderController.cryptomusCallbackController);
orderRoute.delete("/:id", orderController.AdmindeleteOrder);
orderRoute.put("/updateProfile", authenticateJWTId, orderController.updateUserProfileForOrderHandler);
orderRoute.post("/cryptomus-callback", orderController.cryptomusCallbackController);
orderRoute.get("/allOrder/:paymentType", authenticateJWTId, orderController.getOrdersByPaymentType);

orderRoute.post(
  "/bulk-accept-orders",
  authenticateJWT,
  authorizeRole(Others.role.SUPERADMIN, Others.role.ADMIN),
  orderController.SuperAdminAccepted
);
orderRoute.post(
  "/bulk-reject-orders",
  authenticateJWT,
  authorizeRole(Others.role.SUPERADMIN, Others.role.ADMIN),
  orderController.SuperAdminRejected
);

orderRoute.put(
  "/update-payment-status/:orderId",
  authenticateJWT,
  authorizeRole(Others.role.SUPERADMIN, Others.role.ADMIN),
  adminUpdateOrderPaymentStatus
);

export default orderRoute;
