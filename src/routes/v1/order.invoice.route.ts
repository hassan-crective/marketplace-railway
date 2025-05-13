import { Router } from "express";
 
import { authenticateJWTId } from "../../middlewares/verifyid";
import { findAllOrderInvoices } from "../../controllers/order.invocie.controller";

const orderInvoiceRoute = Router();

// GET all order invoices (requires authentication)
orderInvoiceRoute.get("/", authenticateJWTId, findAllOrderInvoices);

export default orderInvoiceRoute;
