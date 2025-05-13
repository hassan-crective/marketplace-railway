import { Router } from "express";
import {
  createModeratorController,
  createAdminController,
  approvePublisherController,
  rejectPublisherController,
  deletePublisherController,
  approveProductController,
  rejectProductController,
  getModeratorsByAdminController,
  deleteModeratorByAdminController,
  updateModeratorByAdminController,
  updateAdminsBySuperAdminController,
  getAdminsAndModeratorsController,
  getProductsController,
  getPublisherController,
  getWithdrawalRequestsController,
  approveWithdrawalRequestController,
  rejectWithdrawalRequestController,
  generatePayoutController,
  deleteAdminController,
  softDeleteWithdrawal,
  approveUpdateRequestController,
  getAllUpdateRequests,
  rejectProductEditRequestController,
  deleteProductsController,
  updateProductController,
  getPublisherStatistics,
  fetchProductsFromSheet,
  getAdminStatistics,
  getAllCategoriesController,
  getAllPermissionController,
  approveBulkProductsController,
  rejectBulkProductsController,
  getAllUsers,
  deleteUserDetail,
  editUserDetail,
} from "../../controllers/admin.controllers";
import { authenticateJWT } from "../../middlewares/auth.middleware";
import { checkPermission } from "../../middlewares/permission.middleware";
import { authorizeRole } from "../../middlewares/role.middleware";
import { Others } from "../../enums/others.enum";
import { deleteOrdersBulk } from "../../controllers/order.controller";
const adminRouter = Router();

adminRouter.post(
  "/create-moderator",
  authenticateJWT,
  checkPermission(["create-moderator"]),
  authorizeRole(Others.role.SUPERADMIN),
  createModeratorController
);
adminRouter.post("/create-admin", authenticateJWT, authorizeRole(Others.role.SUPERADMIN), createAdminController);
adminRouter.put(
  "/approve-publisher/:publisherId",
  authenticateJWT,
  authorizeRole(Others.role.SUPERADMIN, Others.role.ADMIN, Others.role.MODERATOR),
  checkPermission(["approve_publisher"]),
  approvePublisherController
);
adminRouter.put(
  "/reject-publisher/:publisherId",
  authenticateJWT,
  authorizeRole(Others.role.SUPERADMIN, Others.role.ADMIN, Others.role.MODERATOR),
  checkPermission(["reject_publisher"]),
  rejectPublisherController
);
adminRouter.delete(
  "/delete-publisher/:publisherId",
  authenticateJWT,
  authorizeRole(Others.role.SUPERADMIN, Others.role.ADMIN, Others.role.MODERATOR),
  checkPermission(["delete_publisher"]),
  deletePublisherController
);
adminRouter.put(
  "/approve-product/:productId",
  authenticateJWT,
  authorizeRole(Others.role.SUPERADMIN, Others.role.ADMIN, Others.role.MODERATOR),
  checkPermission(["approve_product"]),
  approveProductController
);
adminRouter.put(
  "/reject-product/:productId",
  authenticateJWT,
  authorizeRole(Others.role.SUPERADMIN, Others.role.ADMIN, Others.role.MODERATOR),
  checkPermission(["reject_products"]),
  rejectProductController
);
adminRouter.delete(
  "/delete-moderator/:moderatorId",
  authenticateJWT,
  authorizeRole(Others.role.SUPERADMIN),
  checkPermission(["delete-moderators"]),
  deleteModeratorByAdminController
);
adminRouter.put(
  "/update-moderator/:moderatorId",
  authenticateJWT,
  authorizeRole(Others.role.SUPERADMIN),
  checkPermission(["update-moderators"]),
  updateModeratorByAdminController
);
adminRouter.get(
  "/get-admins-and-moderators",
  authenticateJWT,
  authorizeRole(Others.role.SUPERADMIN),
  getAdminsAndModeratorsController
);
adminRouter.put(
  "/update-admins/:adminId",
  authenticateJWT,
  authorizeRole(Others.role.SUPERADMIN),
  updateAdminsBySuperAdminController
);
adminRouter.get(
  "/get-products",
  authenticateJWT,
  authorizeRole(Others.role.SUPERADMIN, Others.role.ADMIN, Others.role.MODERATOR),
  checkPermission(["view_products"]),
  getProductsController
);

adminRouter.get(
  "/get-publisher",
  authenticateJWT,
  authorizeRole(Others.role.SUPERADMIN, Others.role.ADMIN, Others.role.MODERATOR),
  checkPermission(["view_publishers"]),
  getPublisherController
);

adminRouter.get(
  "/get-withdrawl-requests",
  authenticateJWT,
  authorizeRole(Others.role.SUPERADMIN, Others.role.ADMIN, Others.role.MODERATOR),
  checkPermission(["view_withdrawl"]),
  getWithdrawalRequestsController
);
adminRouter.patch(
  "/approve-withdrawl-requests/:withdrawalId",
  authorizeRole(Others.role.SUPERADMIN, Others.role.ADMIN, Others.role.MODERATOR),
  authenticateJWT,
  checkPermission(["approve_withdrawl"]),
  approveWithdrawalRequestController
);
adminRouter.patch(
  "/reject-withdrawl-requests/:withdrawalId",
  authenticateJWT,
  authorizeRole(Others.role.SUPERADMIN, Others.role.ADMIN, Others.role.MODERATOR),
  checkPermission(["reject_withdrawl"]),
  rejectWithdrawalRequestController
);
adminRouter.get(
  "/get-moderators-by-admin",
  authorizeRole(Others.role.SUPERADMIN),
  authenticateJWT,
  checkPermission(["view-moderators"]),
  getModeratorsByAdminController
);
adminRouter.post(
  "/generate-payout/:withdrawalId",
  authenticateJWT,
  authorizeRole(Others.role.SUPERADMIN),
  generatePayoutController
);

adminRouter.delete(
  "/delete-admins/:adminId",
  authenticateJWT,
  authorizeRole(Others.role.SUPERADMIN),
  deleteAdminController
);

adminRouter.delete(
  "/delete-withdrawl/:withdrawalId",
  authenticateJWT,
  authorizeRole(Others.role.SUPERADMIN, Others.role.ADMIN, Others.role.MODERATOR),
  softDeleteWithdrawal
);
adminRouter.get(
  "/get-update-site-requests",
  authenticateJWT,
  authorizeRole(Others.role.SUPERADMIN, Others.role.ADMIN, Others.role.MODERATOR),
  getAllUpdateRequests
);
adminRouter.patch(
  "/approve-site-update-requests/:productId",
  authenticateJWT,
  authorizeRole(Others.role.SUPERADMIN, Others.role.ADMIN, Others.role.MODERATOR),
  approveUpdateRequestController
);

adminRouter.patch(
  "/reject-site-update-requests/:productId",
  authenticateJWT,
  authorizeRole(Others.role.SUPERADMIN, Others.role.ADMIN, Others.role.MODERATOR),
  rejectProductEditRequestController
);
adminRouter.delete(
  "/delete-product/:id",
  authenticateJWT,
  authorizeRole(Others.role.ADMIN, Others.role.SUPERADMIN, Others.role.MODERATOR),
  deleteProductsController
);
adminRouter.put(
  "/update-product/:id",
  authenticateJWT,
  authorizeRole(Others.role.SUPERADMIN, Others.role.ADMIN, Others.role.MODERATOR),
  updateProductController
);
adminRouter.put(
  "/bulk-approve-products",
  authenticateJWT,
  authorizeRole(Others.role.SUPERADMIN, Others.role.ADMIN, Others.role.MODERATOR),
  approveBulkProductsController
);

adminRouter.put(
  "/bulk-reject-products",
  authenticateJWT,
  authorizeRole(Others.role.SUPERADMIN, Others.role.ADMIN, Others.role.MODERATOR),
  rejectBulkProductsController
);
adminRouter.delete(
  "/bulk-delete-orders",
  authenticateJWT,
  authorizeRole(Others.role.SUPERADMIN, Others.role.ADMIN, Others.role.MODERATOR),
  deleteOrdersBulk
);

adminRouter.get(
  "/get-admin-stats",
  authenticateJWT,
  authorizeRole(Others.role.MODERATOR, Others.role.SUPERADMIN),
  getAdminStatistics
);
adminRouter.get("/get-publisher-stats", authenticateJWT, authorizeRole(Others.role.PUBLISHER), getPublisherStatistics);
adminRouter.post(
  "/google-sheet-products",
  authenticateJWT,
  authorizeRole(Others.role.MODERATOR, Others.role.ADMIN, Others.role.SUPERADMIN),
  fetchProductsFromSheet
);
adminRouter.get("/get-categories", authenticateJWT, getAllCategoriesController);
adminRouter.get("/get-permissions", authenticateJWT, getAllPermissionController);

adminRouter.get(
  "/get-users-detail",
  authenticateJWT,
  authorizeRole(Others.role.ADMIN, Others.role.SUPERADMIN),
  getAllUsers
);

adminRouter.delete(
  "/:userId",
  authenticateJWT,
  authorizeRole(Others.role.ADMIN, Others.role.SUPERADMIN),
  deleteUserDetail
);

adminRouter.put("/:userId", authenticateJWT, authorizeRole(Others.role.ADMIN, Others.role.SUPERADMIN), editUserDetail);
export default adminRouter;
