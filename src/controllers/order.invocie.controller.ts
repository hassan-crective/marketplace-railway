import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/verifyid";
import { asyncWrapper } from "../utils/wrapperFunctionTryCatch";
import { findAllOrdersInvoice } from "../services/order.invocie.service";
import { OrderInvocieValidationSchemaQuery } from "../validators/order.invoice.validation";
 
export const findAllOrderInvoices = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized: Missing user ID" });
  }

  const validatedQuery =  OrderInvocieValidationSchemaQuery.parse(req.query);

  const response = await findAllOrdersInvoice(req.userId, validatedQuery);

  return res.status(200).json({
    total: response.total,
    items: response.items,
    page: validatedQuery.page,
    limit: validatedQuery.limit,
  });
});
