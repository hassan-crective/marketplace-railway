import { Request, Response, NextFunction } from "express";
import {
  AdminInputSchema,
  ModeratorInputSchema,
  ApproveProductInput,
  RejectProductInput,
  UpdateUserDetail,
} from "../validators/admin.validation";
import {
  createModerator,
  createAdmin,
  approvePublisher,
  rejectPublisher,
  deletePublisher,
  getNonApprovedPublishers,
  approveProduct,
  rejectProduct,
  getModeratorsByAdmin,
  deleteModeratorByAdmin,
  updateModeratorByAdmin,
  getAdminsAndModeratorsBySuperAdmin,
  updateAdminsBySuperAdmin,
  getProductsByFilter,
  getWithdrawalRequests,
  approveWithdrawalRequest,
  rejectWithdrawalRequest,
  generatePayoutForApprovedRequests,
  deleteAdminAndModerators,
  softDeleteWithdrawalRequest,
  approveEditRequest,
  getUpdateRequests,
  rejectProductEditRequest,
  getAdminStats,
  getProductsFromGoogleSheet,
  getPublishersStats,
  deleteProductService,
  updateProductService,
  getAllCategoriesService,
  getAllPermissionService,
  approveBulkProducts,
  rejectBulkProducts,
  getAllUser,
  deleteUser,
  editUser,
} from "../services/admin.services";
import { asyncWrapper } from "../utils/wrapperFunctionTryCatch";
import { BadRequestError } from "../errors/badRequest.error";
import { UserRepository } from "../repositories";
import { NotFoundError } from "../errors/notFound.error";
import {
  BulkProductApproveInputSchema,
  BulkProductRejectInputSchema,
  ProductApproveInputSchema,
} from "../validators/product.validation";
// import { Others } from "../enums/others.enum";

export const createModeratorController = asyncWrapper(async (req: Request, res: Response, next: NextFunction) => {
  console.log("Create Moderator called", { body: req.body }, "AuthController");

  const validatedInput = ModeratorInputSchema.parse(req.body);
  const adminId = req.user.userId;
  console.log(adminId);

  if (!adminId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const newModerator = await createModerator(validatedInput, adminId);

  res.status(201).json({
    message: "Moderator created successfully",
    data: newModerator,
  });
});

export const getModeratorsByAdminController = asyncWrapper(async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("Decoded User:", req.user);
    console.log("Get Moderators called", { query: req.query }, "AuthController");

    const adminId = req.user.userId; // Use optional chaining to avoid runtime errors
    const query = req.query; // Query parameters for sorting and pagination

    // if (!adminId) {
    //   return res.status(401).json({ message: "User not authenticated" });
    // }

    const { moderators, total } = await getModeratorsByAdmin(adminId, query);

    res.status(200).json({
      message: "Moderators fetched successfully",
      data: moderators,
      total,
      page: query.page || 1,
      limit: query.limit || 10,
    });
  } catch (error) {
    console.error("Error in getModeratorsByAdminController", error);
    next(error);
  }
});

export const deleteModeratorByAdminController = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log("Delete Moderator called", { body: req.body, adminId: req.user }, "AuthController");

    const adminId = req.user.userId;
    const { moderatorId } = req.params;
    console.log(moderatorId);

    if (!adminId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const result = await deleteModeratorByAdmin(moderatorId, adminId);

    res.status(200).json(result);
  }
);

export const updateModeratorByAdminController = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log("Update Moderator called", { body: req.body, adminId: req.user }, "AuthController");

    const adminId = req.user.userId; // Assuming `req.user` contains the authenticated admin's ID
    const { moderatorId } = req.params; // Moderator ID should be passed as a route parameter
    const updateData = req.body; // Update data should be in the request body

    if (!adminId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const updatedModerator = await updateModeratorByAdmin(moderatorId, adminId, updateData);

    res.status(200).json({
      message: "Moderator updated successfully",
      data: updatedModerator,
    });
  }
);

export const createAdminController = asyncWrapper(async (req: Request, res: Response, next: NextFunction) => {
  console.log("Create Moderator called", { body: req.body }, "AuthController");

  const validatedInput = ModeratorInputSchema.parse(req.body);
  const adminId = req.user;
  console.log(adminId);

  if (!adminId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const newModerator = await createAdmin(validatedInput, adminId);

  res.status(201).json({
    message: "Admin created successfully",
    data: newModerator,
  });
});

export const getAdminsAndModeratorsController = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log("Fetching admins and moderators", { user: req.user, query: req.query }, "AuthController");

    const superAdminId = req.user;

    if (!superAdminId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { admins, totalAdmins } = await getAdminsAndModeratorsBySuperAdmin(superAdminId, req.query);

    console.log("Result from service:", { admins, totalAdmins });

    res.status(200).json({
      message: "Admins and their moderators fetched successfully",
      data: {
        totalAdmins,
        admins,
      },
    });
  }
);

export const updateAdminsBySuperAdminController = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log("Update admin called", { body: req.body, superadminId: req.user }, "AuthController");

    const superadminId = req.user.userId; // Assuming `req.user` contains the authenticated superadmin's ID
    const { adminId } = req.params; // Admin ID should be passed as a route parameter
    const updateData = req.body; // Update data should be in the request body

    if (!superadminId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    try {
      const updatedAdmin = await updateAdminsBySuperAdmin(adminId, superadminId, updateData);
      res.status(200).json({
        message: "Admin updated successfully",
        data: updatedAdmin,
      });
    } catch (error) {
      next(error);
    }
  }
);

export const approvePublisherController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("Approve Publisher called", { body: req.body });

    const { publisherId } = req.params;
    console.log(publisherId);
    const adminId = req.user.userId;

    const response = await approvePublisher(publisherId, adminId);

    res.status(200).json(response);
  } catch (error) {
    console.error("Error in approvePublisherController", { error, body: req.body });

    next(error);
  }
};

export const rejectPublisherController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("Reject Publisher called", { body: req.body });

    const { publisherId } = req.params;
    const adminId = req.user.userId;

    const response = await rejectPublisher(publisherId, adminId);

    res.status(200).json(response);
  } catch (error) {
    console.error("Error in rejectPublisherController", { error, body: req.body });

    next(error);
  }
};

export const deletePublisherController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("Delete Publisher Controller called", { body: req.params });

    const { publisherId } = req.params;

    const response = await deletePublisher(publisherId);

    res.status(200).json(response);
  } catch (error) {
    console.error("Error in deletePublisherController", { error, body: req.body });

    next(error);
  }
};
export const getPublisherController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("Get Non-Approved Publishers Controller called");

    // Extract 'status' from query parameters (e.g., /publishers?status=pending)
    let status = req.query.status as string;
    console.log("Received Status:", status); // Debugging

    if (!status) {
      return res.status(400).json({
        message: "Status parameter is required. Valid values are: pending, approved, rejected, all",
      });
    }

    // Normalize status to lowercase for comparison
    status = status.trim().toLowerCase();

    // Validate the status parameter
    const validStatuses = ["pending", "approved", "rejected", "all"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status parameter. Valid values are: pending, approved, rejected, all",
      });
    }

    // Call the service with the normalized status
    const response = await getNonApprovedPublishers(status);

    res.status(200).json(response);
  } catch (error) {
    console.error("Error in getNonApprovedPublishersController", { error });
    next(error);
  }
};

export const approveProductController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("Approve Product called", { params: req.params, body: req.body });

    const { productId } = req.params;
    const adminId = req.user.userId; // Get admin ID from authentication middleware

    // Validate input using Zod
    const approveProductInput = ProductApproveInputSchema.parse(req.body);

    const response = await approveProduct(productId, adminId, approveProductInput);
    res.status(200).json(response);
  } catch (error) {
    console.error("Error in approveProductController", { error, params: req.params });
    next(error);
  }
};

export const rejectProductController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("Reject Product called", { params: req.params, body: req.body });

    const { productId } = req.params;

    const rejectProductInput = req.body;
    const adminId = req.user.userId;

    if (!rejectProductInput || !rejectProductInput.rejectionReason) {
      throw new BadRequestError("Missing or invalid rejection reason");
    }

    const response = await rejectProduct(productId, adminId, rejectProductInput);

    res.status(200).json(response);
  } catch (error) {
    console.error("Error in rejectProductController", { error, params: req.params, body: req.body });
    next(error);
  }
};

export const getProductsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query; // Expecting 'pending', 'approved', or 'rejected'

    if (!status) {
      return res.status(400).json({ message: "Status query parameter is required" });
    }

    const products = await getProductsByFilter(status as string);

    res.status(200).json({
      message: `Products retrieved successfully for status: ${status}`,
      data: products,
    });
  } catch (error) {
    console.error("Error in getProductsController", error);
    next(error);
  }
};

export const getWithdrawalRequestsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query; // Retrieve the status from query parameters

    if (!status || typeof status !== "string") {
      return res.status(400).json({ message: "Invalid or missing status query parameter" });
    }

    const withdrawalRequests = await getWithdrawalRequests(status);

    return res.status(200).json({
      message: `Withdrawal requests retrieved successfully for status: ${status}`,
      data: withdrawalRequests,
    });
  } catch (error) {
    console.error("Error in getWithdrawalRequestsController:", error);
    next(error); // Pass error to error-handling middleware
  }
};

export const approveWithdrawalRequestController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { withdrawalId } = req.params; // Extract withdrawal ID from request params

    if (!withdrawalId) {
      return res.status(400).json({ message: "Withdrawal ID is required" });
    }

    const response = await approveWithdrawalRequest(withdrawalId);

    return res.status(200).json({
      message: "Withdrawal request approved successfully",
      data: response,
    });
  } catch (error) {
    console.error("Error in approveWithdrawalRequestController:", error);
    next(error); // Pass error to error-handling middleware
  }
};

export const rejectWithdrawalRequestController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { withdrawalId } = req.params; // Extract withdrawal ID from request params

    if (!withdrawalId) {
      return res.status(400).json({ message: "Withdrawal ID is required" });
    }

    const response = await rejectWithdrawalRequest(withdrawalId);

    return res.status(200).json({
      message: "Withdrawal request rejected successfully",
      data: response,
    });
  } catch (error) {
    console.error("Error in rejectWithdrawalRequestController:", error);
    next(error); // Pass error to error-handling middleware
  }
};

export const generatePayoutController = async (req: Request, res: Response) => {
  try {
    const { withdrawalId } = req.params;
    const authToken = req.headers.authorization;

    if (!authToken) {
      return res.status(401).json({ message: "Authentication token is required" });
    }

    const result = await generatePayoutForApprovedRequests(withdrawalId, authToken);

    res.status(200).json(result);
  } catch (err: any) {
    console.error("Error generating payout:", err.message);

    res.status(err.statusCode || 500).json({
      message: err.message || "Internal server error",
      details: err.details || null,
    });
  }
};

export const deleteAdminController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const superadminId = req.user.userId; // Assuming the superadmin's user ID is in `req.user`
    const { adminId } = req.params; // Admin ID to delete, passed as route parameter

    if (!superadminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await deleteAdminAndModerators(adminId, superadminId);

    return res.status(200).json(result);
  } catch (error) {
    next(error); // Pass any errors to the error handler
  }
};
export const softDeleteWithdrawal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { withdrawalId } = req.params; // Extract withdrawal ID from route parameter

    // Call the service for soft deletion
    const result = await softDeleteWithdrawalRequest(withdrawalId);

    // Send success response
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in deleteWithdrawalRequest controller:", error);

    // Pass the error to the global error handler
    next(error);
  }
};
export const getAllUpdateRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updateRequests = await getUpdateRequests();

    res.status(200).json({
      message: "Product update requests retrieved successfully",
      products: updateRequests,
    });
  } catch (error) {
    next(error); // Pass the error to the middleware for centralized error handling
  }
};
export const approveUpdateRequestController = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        message: "Product ID is required",
      });
    }

    const updatedProduct = await approveEditRequest(productId);

    return res.status(200).json({
      message: "Product update approved successfully",
      product: updatedProduct,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Error approving product update",
      error: error.message || "Internal Server Error",
    });
  }
};
export const rejectProductEditRequestController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;

    const rejectedProduct = await rejectProductEditRequest(productId);

    res.status(200).json({
      message: "Product edit request rejected successfully",
      product: rejectedProduct,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Error approving product update",
      error: error.message || "Internal Server Error",
    });
  }
};

export const deleteProductsController = async (req: Request, res: Response) => {
  try {
    const { id: productId } = req.params; // Ensure correct param name

    console.log("Product ID from request:", productId);

    // Call the service to delete the product
    const response = await deleteProductService(productId);

    return res.status(200).json(response);
  } catch (error: any) {
    console.error("Error deleting product:", error.message || error);

    if (error instanceof BadRequestError) {
      return res.status(400).json({ message: error.message });
    } else if (error instanceof NotFoundError) {
      return res.status(404).json({ message: error.message });
    }

    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// update controller

// export const updateProductController = async (req: Request, res: Response) => {
//   try {
//     const { productId } = req.params;
//     const updateData = req.body;

//     const updatedProduct = await updateProductService(productId, updateData);

//     if (!updatedProduct) {
//       return res.status(404).json({ message: "Product not found" });
//     }

//     // ✅ Remove updateFields from response
//     const { updateFields, ...filteredProduct } = updatedProduct;

//     res.status(200).json({
//       message: "Product updated successfully",
//       product: filteredProduct, // `updateFields` removed
//     });
//   } catch (error) {
//     res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred" });
//   }
// };

export const updateProductController = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const updateData = req.body;

    const updatedProduct = await updateProductService(productId, updateData);

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ✅ Remove updateFields from response
    const { updateFields, ...filteredProduct } = updatedProduct;

    res.status(200).json({
      message: "Product updated successfully",
      product: filteredProduct, // `updateFields` removed
    });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred" });
  }
};

export const getAdminStatistics = async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId;
    const statistics = await getAdminStats(userId);
    return res.status(200).json({
      message: "Admin statistics fetched successfully",
      data: statistics,
    });
  } catch (error) {
    console.error("Error fetching admin statistics:", error);

    // Return a suitable error response
    return res.status(400).json({
      message: "Failed to fetch admin statistics",
      error: error instanceof Error ? error.message : "Unexpected error occurred",
    });
  }
};
const extractSheetId = (url: string): string | null => {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
};

export const fetchProductsFromSheet = async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId; // Extract userId from request (ensure middleware sets it correctly)
    const sheetParam = req.query.sheetId as string;

    // Check for sheetId query parameter
    if (!sheetParam) {
      return res.status(400).json({ message: "Google Sheet URL or ID is required" });
    }

    // Fetch user instance from the database
    const user = await UserRepository.findOne({ where: { id: userId } }); // Replace with your ORM query

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Determine if the input is a full URL or an ID
    const sheetId = sheetParam.includes("spreadsheets/d/")
      ? extractSheetId(sheetParam) // Extract ID if it's a URL
      : sheetParam; // Use as-is if it's already an ID

    if (!sheetId) {
      return res.status(400).json({ message: "Invalid Google Sheet URL or ID" });
    }

    // Fetch products and associate with the user instance
    const products = await getProductsFromGoogleSheet(sheetId, user);

    res.status(200).json({ message: "Products successfully fetched and saved", products });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      res.status(500).json({ message: "An error occurred", error: error.message });
    } else {
      console.error("Unknown error:", error);
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const getPublisherStatistics = async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId;
    const statistic = await getPublishersStats(userId);
    return res.status(200).json({
      message: "Publisher statistics fetched successfully",
      data: statistic,
    });
  } catch (error) {
    console.error("Error fetching admin statistics:", error);

    // Return a suitable error response
    return res.status(400).json({
      message: "Failed to fetch admin statistics",
      error: error instanceof Error ? error.message : "Unexpected error occurred",
    });
  }
};

export const getAllCategoriesController = asyncWrapper(async (req: Request, res: Response) => {
  try {
    const categories = getAllCategoriesService();
    return res.status(200).json({
      success: true,
      total: categories.length,
      categories,
    });
  } catch (error) {
    console.error("Error Fetching Categories:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

export const getAllPermissionController = asyncWrapper(async (req: Request, res: Response) => {
  try {
    const permission = getAllPermissionService();
    return res.status(200).json({
      success: true,
      total: permission.length,
      permission,
    });
  } catch (error) {
    console.error("Error Fetching permissions:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});
export const approveBulkProductsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("Bulk Approve Products called", { body: req.body });

    const adminId = req.user.userId; // Get admin ID from authentication middleware

    // Validate input using Zod
    const bulkApproveInput = BulkProductApproveInputSchema.parse(req.body);

    const response = await approveBulkProducts(adminId, bulkApproveInput);
    res.status(200).json(response);
  } catch (error) {
    console.error("Error in approveBulkProductsController", { error });
    next(error);
  }
};

export const rejectBulkProductsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("Bulk Reject Products called", { body: req.body });

    const adminId = req.user.userId; // Get admin ID from authentication middleware

    // Validate input using Zod
    const bulkRejectInput = BulkProductRejectInputSchema.parse(req.body);

    const response = await rejectBulkProducts(adminId, bulkRejectInput);
    res.status(200).json(response);
  } catch (error) {
    console.error("Error in rejectBulkProductsController", { error });
    next(error);
  }
};

export const getAllUsers = asyncWrapper(async (req, res) => {
  try {
    const allUsers = await getAllUser();
    return res.status(200).json({
      success: true,
      total: allUsers.length,
      allUsers,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

export const deleteUserDetail = asyncWrapper(async (req, res) => {
  try {
    await deleteUser(req.params.userId);
    return res.status(200).json({
      success: true,
      message: "User deleted succesfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

export const editUserDetail = asyncWrapper(async (req, res) => {
  try {
    // Validate request body using Zod
    const validatedData = UpdateUserDetail.parse(req.body);

    await editUser(req.params.userId, validatedData);

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});
