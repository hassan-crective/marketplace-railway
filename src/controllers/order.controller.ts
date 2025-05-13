import { NextFunction, Request, Response } from "express";
import { asyncWrapper } from "../utils/wrapperFunctionTryCatch";
import {
  CreateUserOrderSchema,
  RequestOrderToPublisherSchema,
  OrderIdSchema,
  OrderValidationSchemaQuery,
  BulkOrderIdSchema,
} from "../validators/order.validation";
import {
  createOrder,
  deleteOrderAdmin,
  findAllOrders,
  findAllOrdersAdmin,
  findOrderById,
  getPublisherOrders,
  processCryptomusCallback,
  requestOrderToPublisher,
  SuperAdminAccept,
  SuperAdminReject,
  updateAcceptedOrder,
  updateOrderByIds,
  updateOrderStatus,
  updateRejectedOrder,
  updateSubmitedOrder,
  updateUserProfileForOrder,
  getOrdersOnPaymentType,

  SuperAdminBulkReject,
  SuperAdminBulkAccept,
  bulkDeleteOrdersAdmin,
  updateOrderPaymentStatus,
} from "../services/order.service";
import { AuthenticatedRequest } from "../middlewares/verifyid";
import { Others } from "../enums/others.enum";
import { BadRequestError } from "../errors/badRequest.error";
import { NotFoundError } from "../errors/notFound.error";

const createOrderHandler = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized: Missing user ID" });
  }

  const validatedData = CreateUserOrderSchema.parse(req.body);
  const order = await createOrder(req.userId, validatedData);

  res.status(201).json({
    message: "Order created successfully",
    data: order,
  });
});

export const requestOrderToPublisherHandler = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized: Missing user ID" });
  }

  const validatedData = RequestOrderToPublisherSchema.parse(req.body);
  const order = await requestOrderToPublisher(req.userId, validatedData);

  res.status(201).json({
    message: "Order request sent to publisher",
    data: order,
  });
});

export const findAll = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized: Missing user ID" });
  }

  const validatedQuery = OrderValidationSchemaQuery.parse(req.query);
  const response = await findAllOrders(req.userId, validatedQuery);

  res.status(200).json({
    total: response.total,
    items: response.items,
    page: validatedQuery.page,
    limit: validatedQuery.limit,
  });
});

export const findAllOrdes = async (req: Request, res: Response) => {
  const validatedQuery = OrderValidationSchemaQuery.parse(req.query);
  const response = await findAllOrdersAdmin(validatedQuery);
  res.status(200).json({
    total: response.total,
    items: response.items,
    page: validatedQuery.page,
    limit: validatedQuery.limit,
  });
};

export const getOrderById = asyncWrapper(async (req: Request, res: Response) => {
  const { id } = OrderIdSchema.parse(req.params);
  const order = await findOrderById(id);

  res.status(200).json({ data: order });
});

export const orderAccepted = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId || req.user?.id;

  const orderId = req.params.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized: Missing user ID" });
  }

  const updatedOrder = await updateAcceptedOrder(userId, orderId);

  res.status(200).json({
    message: "Order accepted successfully",
    order: updatedOrder,
  });
});

export const orderRejected = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId || req.user?.id;
  const orderId = req.params.id;
  const { rejectionReason } = req.body;

  console.log("orderID:", orderId);

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized: Missing user ID" });
  }

  const updatedOrder = await updateRejectedOrder(userId, orderId, rejectionReason);

  res.status(200).json({
    message: "Order rejected successfully",
    order: updatedOrder,
  });
});

export const orderSubmited = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId || req.user?.id;
  const { submissionUrl, submissionDetails } = req.body;

  if (!submissionUrl || !submissionDetails) {
    throw new BadRequestError("SubmissionURL and SubmissionDetails are required to Submit the Order.");
  }
  const orderId = req.params.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized: Missing user ID" });
  }

  const updatedOrder = await updateSubmitedOrder(userId, orderId, submissionUrl, submissionDetails);

  res.status(200).json({
    message: "Order submitted successfully",
    order: updatedOrder,
  });
});

export const orderStatusUpdate = asyncWrapper(async (req: Request, res: Response) => {
  const { orderStatus, submissionUrl, submissionDetails } = req.body;
  const orderId = req.params.id;

  // if (!userId) {
  //   return res.status(401).json({ message: "Unauthorized: Missing user ID" });
  // }
  const updatedOrder = await updateOrderStatus(orderId, orderStatus, submissionUrl, submissionDetails);
  res.status(200).json({
    message: "Order updated successfully",
    order: updatedOrder,
  });
});

export const SuperAdminAccepted = asyncWrapper(async (req: Request, res: Response, next: NextFunction) => {
  const orderId = req.params.id;

  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized: User not found" });
  }

  const { email: adminEmail } = req.user;

  try {
    const updatedOrder = await SuperAdminAccept(orderId, adminEmail);
    res.status(200).json({
      message: "Order accepted successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Acceptance error:", error);
    next(error);
  }
});

export const SuperAdminRejected = asyncWrapper(async (req: Request, res: Response) => {
  const orderId = req.params.id;
  const { rejectionReason } = req.body;

  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized: User not found" });
  }

  const { email: adminEmail, role } = req.user;

  if (![Others.role.ADMIN, Others.role.SUPERADMIN, Others.role.MODERATOR].includes(role)) {
    return res.status(403).json({ message: "Forbidden: Insufficient privileges" });
  }

  if (!rejectionReason?.trim()) {
    return res.status(400).json({ message: "Rejection reason is required" });
  }

  try {
    const updatedOrder = await SuperAdminReject(orderId, rejectionReason, adminEmail);

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found after update" });
    }

    res.status(200).json({
      message: "Order rejected successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Rejection error:", error);
    res.status(500).json({
      message: "Failed to reject order",
    });
  }
});

export const AdmindeleteOrder = asyncWrapper(async (req: Request, res: Response) => {
  const { id } = OrderIdSchema.parse(req.params);
  const result = await deleteOrderAdmin(id);
  res.status(200).json(result);
});

export const orderStatusUpdateById = asyncWrapper(async (req: Request, res: Response) => {
  const { orderStatus } = req.body;
  const userId = req.user.id;
  const orderId = req.params.orderId;

  if (!orderId) {
    return res.status(400).json({ message: "Order ID is required" });
  }

  if (!orderStatus) {
    return res.status(400).json({ message: "Kindly add the Order Status" });
  }

  const updatedOrder = await updateOrderByIds(orderId, userId, orderStatus);

  res.status(200).json({
    message: "Order updated successfully",
    order: updatedOrder.order,
  });
});

export const getPublisherOrdersHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const validatedQuery = OrderValidationSchemaQuery.parse(req.query);

    const response = await getPublisherOrders(userId, validatedQuery);

    res.status(200).json({
      total: response.total,
      items: response.items,
      page: validatedQuery.page,
      limit: validatedQuery.limit,
    });
  } catch (error) {
    console.error("Error fetching publisher orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const cryptomusCallbackController = asyncWrapper(async (req: Request, res: Response): Promise<void> => {
  const { uuid, status, txid } = req.body;
  const updateResult = await processCryptomusCallback(uuid, status, txid);
  res.status(200).json({
    message: "Payment status updated successfully",
    updateResult,
  });
});

export const updateUserProfileForOrderHandler = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized: Missing user ID" });
  }

  console.log("requested User:", req.userId);

  const updatedUser = await updateUserProfileForOrder(req.userId, req.body);
  res.status(200).json({
    message: "User profile updated successfully",
    data: updatedUser,
  });
});

export const getOrdersByPaymentType = asyncWrapper(async (req, res) => {
  const { paymentType } = req.params;
  const allOrders = await getOrdersOnPaymentType(paymentType);
  res.status(200).json({
    message: `All orders retrieved based on ${paymentType}`,
    data: allOrders,
  });
});



export const SuperAdminBulkAccepted = asyncWrapper(async (req: Request, res: Response) => {
  const { orderIds } = req.body;

  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized: User not found" });
  }

  if (!Array.isArray(orderIds)) {
    return res.status(400).json({ message: "orderIds must be an array" });
  }

  const { email: adminEmail } = req.user;

  try {
    const results = await SuperAdminBulkAccept(orderIds, adminEmail);
    res.status(200).json({
      message: "Bulk acceptance processed",
      results,
    });
  } catch (error) {console.error("Bulk acceptance error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({
      message: "Failed to process bulk acceptance",
      error: errorMessage,
    });
  }
});

export const SuperAdminBulkRejected = asyncWrapper(async (req: Request, res: Response) => {
  const { orderIds, rejectionReason } = req.body;

  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized: User not found" });
  }

  if (!Array.isArray(orderIds)) {
    return res.status(400).json({ message: "orderIds must be an array" });
  }

  const { email: adminEmail, role } = req.user;

  if (![Others.role.ADMIN, Others.role.SUPERADMIN].includes(role)) {
    return res.status(403).json({ message: "Forbidden: Insufficient privileges" });
  }

  if (!rejectionReason?.trim()) {
    return res.status(400).json({ message: "Rejection reason is required" });
  }

  try {
    const results = await SuperAdminBulkReject(orderIds, rejectionReason, adminEmail);
    res.status(200).json({
      message: "Bulk rejection processed",
      results,
    });
  } catch (error) {
    console.error("Bulk rejection error:", error);
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  res.status(500).json({
    message: "Failed to process bulk rejection",
    error: errorMessage,
    });
  }
});

export const deleteOrdersBulk = async (req: Request, res: Response) => {
  try {
    const { orderIds } = req.body;
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        error: "Please provide a non-empty array of order IDs to delete",
      });
    }

    const result = await bulkDeleteOrdersAdmin(orderIds);
    
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: error.message });
    }
    if (error instanceof BadRequestError) {
      return res.status(400).json({ error: error.message });
    }
    console.error("Error in bulk order deletion:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const adminUpdateOrderPaymentStatus = async (
  req: Request,
  res: Response
) => {
  try {
    console.log("orderID:",req.params)
    const { orderId } = req.params;
    const { status } = req.body;

    console.log("orderID:",orderId)

    if (!orderId || !status) {
      throw new BadRequestError("Order ID and status are required");
    }

    const updatedOrder = await updateOrderPaymentStatus(
      orderId,
      status,
    );

    res.status(200).json({
      success: true,
      data: updatedOrder,
      message: "Order payment status updated successfully",
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: error.message });
    }
    if (error instanceof BadRequestError) {
      return res.status(400).json({ error: error.message }); // Note: BadRequest should be 400, not 404
    }
    console.error("Unhandled error:", error); // Add this to see uncaught errors
    return res.status(500).json({ error: "Internal server error" });
    
  }
};

export default {
  createOrderHandler,
  requestOrderToPublisherHandler,
  findAll,
  getOrderById,
  AdmindeleteOrder,
  findAllOrdes,
  orderAccepted,
  orderRejected,
  orderSubmited,
  orderStatusUpdate,
  SuperAdminAccepted,
  orderStatusUpdateById,
  SuperAdminRejected,
  getPublisherOrdersHandler,
  cryptomusCallbackController,
  updateUserProfileForOrderHandler,
  getOrdersByPaymentType,
  
};
