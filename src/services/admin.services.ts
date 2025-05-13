import {
  ModeratorInput,
  AdminInput,
  ApproveProductInput,
  RejectProductInput,
  UpdateUserDetail,
} from "../validators/admin.validation";
import {
  UserRepository,
  ProductRepository,
  CartRepository,
  WithdrawlRepository,
  InvoiceRepository,
  OrderRepository,
} from "../repositories/index";
import { BadRequestError } from "../errors/badRequest.error";
import { UnauthorizedError } from "../errors/unauthorizedError";
import { NotFoundError } from "../errors/notFound.error";
import bcrypt from "bcrypt";
import { User } from "../models/user";
import { DeepPartial } from "typeorm";
import { generateReferralCode } from "../utils/generateReffralCode";

import { Between } from "typeorm";

import { Others } from "../enums/others.enum";
import { getSortPaging } from "../utils/sortPagination";
import axios from "axios";
import { In, IsNull, Not } from "typeorm";
import { Product } from "../models/product";
import { google } from "googleapis";
import { sendEmail } from "../utils/emails";
import { Order } from "../models/orders";
import { OrderInvoice } from "../models/orderInvoice";
import { Withdrawl } from "../models/withdrawl";
import { Cart } from "../models/cart";

export const createModerator = async (moderatorInput: ModeratorInput, adminId: string) => {
  console.log("Moderator function called", { moderatorInput }, "AuthService");

  // Check if a user with the same email or phone number already exists
  const existingUser = await UserRepository.findOne({
    where: [{ email: moderatorInput.email }],
  });

  if (existingUser) {
    throw new BadRequestError("User with this email  already exists");
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(moderatorInput.password, 10);
  const referralCode = generateReferralCode();

  // Create and save the new moderator
  const newModerator = UserRepository.create({
    ...moderatorInput,
    password: hashedPassword,
    role: "moderator", // Assuming this matches your `Others.role` enum
    permissions: moderatorInput.permissions || [],
    referedBy: adminId,
    isApproved: true,
    isVerified: true,
    referralCode,
  } as DeepPartial<User>);

  console.log(newModerator);

  await UserRepository.save(newModerator);

  return newModerator;
};

export const getModeratorsByAdmin = async (
  adminId: string,
  query: any // Query parameters for sorting and pagination
) => {
  console.log("Fetching moderators", { adminId, query }, "AuthService");

  if (!adminId) {
    throw new UnauthorizedError("Admin ID is required");
  }

  // Get sorting and pagination parameters using the utility function
  const { sort, skip, limit } = getSortPaging(query);

  // Fetch moderators referred by the admin with sorting and pagination
  const [moderators, total] = await UserRepository.findAndCount({
    where: {
      referedBy: adminId,
      role: Others.role.MODERATOR, // Ensures only moderators are fetched
    },
    order: sort,
    skip,
    take: limit,
  });

  return { moderators, total };
};

export const deleteModeratorByAdmin = async (moderatorId: string, adminId: string) => {
  console.log("Deleting moderator", { moderatorId, adminId }, "AuthService");

  if (!adminId) {
    throw new UnauthorizedError("Admin ID is required");
  }

  // Find the moderator to ensure they exist and are referred by the admin
  const moderator = await UserRepository.findOne({
    where: {
      id: moderatorId,
      role: Others.role.MODERATOR,
      referedBy: adminId, // Use the adminId as the referedBy value
    },
  });

  console.log(moderator);
  if (!moderator) {
    throw new BadRequestError("Moderator not found or not referred by this admin");
  }

  // Delete the moderator
  await UserRepository.remove(moderator);

  return { message: "Moderator deleted successfully" };
};

export const updateModeratorByAdmin = async (moderatorId: string, adminId: string, updateData: ModeratorInput) => {
  console.log("Updating moderator", { moderatorId, adminId, updateData }, "AuthService");

  if (!adminId) {
    throw new UnauthorizedError("Admin ID is required");
  }

  // Find the moderator to ensure they exist and are referred by the admin
  const moderator = await UserRepository.findOne({
    where: {
      id: moderatorId,
      role: Others.role.MODERATOR,
      referedBy: adminId, // Use the adminId as the referedBy value
    },
  });

  console.log(moderator);

  if (!moderator) {
    throw new BadRequestError("Moderator not found or not referred by this admin");
  }

  // Update moderator with the provided data
  Object.assign(moderator, updateData);

  await UserRepository.save(moderator);

  return moderator;
};

export const createAdmin = async (moderatorInput: ModeratorInput, adminId: string) => {
  console.log("Moderator function called", { moderatorInput }, "AuthService");

  // Check if a user with the same email or phone number already exists
  const existingUser = await UserRepository.findOne({
    where: [{ email: moderatorInput.email }],
  });

  if (existingUser) {
    throw new BadRequestError("User with this email  already exists");
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(moderatorInput.password, 10);
  const referralCode = generateReferralCode();

  // Create and save the new moderator
  const newModerator = UserRepository.create({
    ...moderatorInput,
    password: hashedPassword,
    role: "moderator", // Assuming this matches your `Others.role` enum
    permissions: moderatorInput.permissions || [],
    referedBy: adminId,
    isApproved: true,
    isVerified: true,
    referralCode,
  } as DeepPartial<User>);

  console.log(newModerator);

  await UserRepository.save(newModerator);

  return newModerator;
};

export const getAdminsAndModeratorsBySuperAdmin = async (superAdminId: string, query: any) => {
  console.log("Fetching admins and their moderators", { superAdminId, query }, "AuthService");

  if (!superAdminId) {
    throw new UnauthorizedError("Super Admin ID is required");
  }

  const { sort } = getSortPaging(query);

  const [admins, totalAdmins] = await UserRepository.findAndCount({
    where: { role: Others.role.ADMIN },
    order: sort,
  });
  console.log("Admins found:", admins, "Total admins:", totalAdmins);

  if (!admins.length) {
    return { totalAdmins: 0, admins: [] };
  }

  const adminIds = admins.map((admin) => admin.id);
  console.log("Admin IDs:", adminIds);

  const moderators = await UserRepository.find({
    where: {
      referedBy: In(adminIds),
      role: Others.role.MODERATOR,
    },
  });
  console.log("Moderators found:", moderators);

  const adminWithModerators = admins.map((admin) => ({
    ...admin,
    moderators: moderators.filter((moderator) => moderator.referedBy === admin.id),
  }));

  return {
    totalAdmins,
    admins: adminWithModerators,
  };
};

export const updateAdminsBySuperAdmin = async (adminId: string, superadminId: string, updateData: ModeratorInput) => {
  console.log("Updating admin", { adminId, superadminId, updateData }, "AuthService");

  if (!superadminId) {
    throw new UnauthorizedError("Superadmin ID is required");
  }

  // Find the admin to ensure they exist
  const admin = await UserRepository.findOne({
    where: {
      id: adminId,
      role: Others.role.ADMIN,
    },
  });

  if (!admin) {
    throw new BadRequestError("Admin not found");
  }

  // Update admin with the provided data
  Object.assign(admin, updateData);

  await UserRepository.save(admin);

  return admin;
};

export const approvePublisher = async (publisherId: string, adminId: string) => {
  try {
    console.log("Approve Publisher function called", { publisherId });

    // Find the publisher by ID
    const publisher = await UserRepository.findOne({ where: { id: publisherId, role: Others.role.PUBLISHER } });
    if (!publisher) {
      throw new NotFoundError("Publisher not found");
    }

    if (publisher.isApproved) {
      throw new BadRequestError("Publisher is already approved");
    }

    // Update the isApproved field to true
    publisher.isApproved = true;
    publisher.approvedby = adminId;

    const updatedPublisher = await UserRepository.save(publisher);
    await sendEmail({
      toEmail: publisher.email,
      subject: "Publisher Request Update",
      text: `Congratulations! Your account has been approved. You can now access publisher-specific feature, `,
    });
    console.log("Publisher approved successfully", { updatedPublisher });

    return { message: "Publisher approved successfully", data: updatedPublisher };
  } catch (error) {
    console.error("Error in approvePublisher function", { error, publisherId });
    throw error;
  }
};

export const rejectPublisher = async (publisherId: string, adminId: string) => {
  try {
    console.log("Reject Publisher function called", { publisherId });

    // Find the publisher by ID
    const publisher = await UserRepository.findOne({ where: { id: publisherId, role: Others.role.PUBLISHER } });
    if (!publisher) {
      throw new NotFoundError("Publisher not found");
    }

    // Update the isApproved field to true
    publisher.isApproved = false;
    publisher.approvedby = adminId;

    await sendEmail({
      toEmail: publisher.email,
      subject: "Publisher Request Rejected",
      text: `Your request to become publisher has been Rejected `,
    });
    const updatedPublisher = await UserRepository.save(publisher);

    console.log("Publisher rejected successfully", { updatedPublisher });

    return { message: "Publisher rejected successfully", data: updatedPublisher };
  } catch (error) {
    console.error("Error in approvePublisher function", { error, publisherId });
    throw error;
  }
};

export const deletePublisher = async (publisherId: string) => {
  try {
    console.log("Delete Publisher function called", { publisherId });

    // Find the publisher by ID
    const publisher = await UserRepository.findOne({ where: { id: publisherId, role: Others.role.PUBLISHER } });

    if (!publisher) {
      throw new NotFoundError("Publisher not found");
    }

    // Delete all products associated with the publisher's userId
    const products = await ProductRepository.find({
      where: { user: { id: publisherId } },
      relations: ["user"], // Ensure the user relation is loaded
    });

    if (products.length > 0) {
      await ProductRepository.remove(products);
      console.log("Associated products deleted", { count: products.length });
    }

    // Delete the publisher
    await UserRepository.remove(publisher);

    console.log("Publisher deleted successfully", { publisherId });

    return {
      message: "Publisher and their associated products deleted successfully",
      data: { publisherId, deletedProducts: products.length },
    };
  } catch (error) {
    console.error("Error in deletePublisher function", { error, publisherId });
    throw error;
  }
};

export const getNonApprovedPublishers = async (status: string) => {
  try {
    console.log(`Fetching publishers with status: ${status}`);

    const filter: any = { role: Others.role.PUBLISHER };

    switch (status) {
      case "pending":
        filter.isApproved = false;
        filter.approvedby = IsNull();
        break;
      case "approved":
        filter.isApproved = true;
        break;
      case "rejected":
        filter.isApproved = false;
        filter.approvedby = Not(IsNull());
        break;
      case "all":
        // No additional filters needed for "all"
        break;
      default:
        throw new Error("Invalid status filter");
    }

    // Fetch publishers based on the status filter
    const publishers = await UserRepository.find({ where: filter });

    console.log(`${status} publishers fetched successfully`, { count: publishers.length });

    // Fetch the total number of publishers
    const totalPublishers = await UserRepository.count({
      where: { role: Others.role.PUBLISHER },
    });

    // Fetch the total number of pending publishers
    const pendingPublishers = await UserRepository.count({
      where: {
        role: Others.role.PUBLISHER,
        isApproved: false,
        approvedby: IsNull(),
      },
    });

    return {
      message: `${status.charAt(0).toUpperCase() + status.slice(1)} publishers fetched successfully`,
      data: publishers,
      totalPublishers,
      pendingPublishers,
    };
  } catch (error) {
    console.error("Error in getNonApprovedPublishers function", { error });
    throw error;
  }
};
export const approveProduct = async (
  productId: string,
  adminId: string,
  approveProductInput: { monthlyTraffic: number; domainRatings: number; domainAuthority: number }
) => {
  try {
    console.log("Approve Product function called", { productId, adminId, approveProductInput });

    const admin = await UserRepository.findOne({ where: { id: adminId } });
    if (!admin) {
      throw new NotFoundError("Admin not found");
    }

    const product = await ProductRepository.findOne({
      where: { id: productId },
      relations: ["user"],
    });
    if (!product) {
      throw new NotFoundError("Product not found");
    }

    // Update product fields
    product.isProductApprove = true;
    product.domainRatings = approveProductInput.domainRatings;
    product.domainAuthority = approveProductInput.domainAuthority;
    product.monthlyTraffic = approveProductInput.monthlyTraffic;
    product.productHandeledBy = admin.email;
    product.productStatus = Others.productstatus.APPROVED;
    product.approvedAt = new Date();

    // Save the updated product
    const updatedProduct = await ProductRepository.save(product);

    // Send email if the product has a user with an email
    if (product.user?.email) {
      await sendEmail({
        toEmail: product.user.email,
        subject: "Publisher Request Approved",
        text: `Your product has been approved.`,
      });
    } else {
      console.warn("Email not found for product user", { productId });
    }

    console.log("Product approved successfully", { updatedProduct });

    return { message: "Product approved successfully", data: updatedProduct };
  } catch (error) {
    console.error("Error in approveProduct function", { error, productId });
    throw error;
  }
};
export const rejectProduct = async (productId: string, adminId: string, rejectProductInput: RejectProductInput) => {
  try {
    console.log("Reject Product function called", { adminId, productId, rejectProductInput });

    const admin = await UserRepository.findOne({ where: { id: adminId } });
    if (!admin) {
      throw new NotFoundError("Admin not found");
    }

    if (!rejectProductInput || !rejectProductInput.rejectionReason) {
      throw new BadRequestError("Missing rejection reason");
    }

    // Find the product by ID and include the user details
    const product = await ProductRepository.findOne({
      where: { id: productId },
      relations: ["user"], // Ensure the 'user' field is fetched
    });
    if (!product) {
      throw new NotFoundError("Product not found");
    }

    if (product.isProductApprove) {
      throw new BadRequestError("Product is already approved and cannot be rejected");
    }

    // Update product fields
    product.isProductApprove = false;
    product.rejectionReason = rejectProductInput.rejectionReason;
    product.productHandeledBy = admin.email;
    product.productStatus = Others.productstatus.REJECTED;

    // Save the updated product
    const updatedProduct = await ProductRepository.save(product);

    // Send email notification if user email exists
    if (product.user?.email) {
      await sendEmail({
        toEmail: product.user.email,
        subject: "Your Product Rejected",
        text: `Your Product request has been Rejected. Reason: ${rejectProductInput.rejectionReason}`,
      });
    } else {
      console.warn("Email not found for product user", { productId });
    }

    console.log("Product rejected successfully", { updatedProduct });

    return { message: "Product rejected successfully", data: updatedProduct };
  } catch (error) {
    console.error("Error in rejectProduct function", { error, productId });
    throw error;
  }
};
// get product
// export const getProductsByFilter = async (status: string) => {
//   let filter = {};

//   switch (status) {
//     case "pending":
//       filter = { isProductApprove: false, rejectionReason: IsNull()  };
//       break;
//     case "approved":
//       filter = { isProductApprove: true };
//       break;
//     case "rejected":
//       filter = { isProductApprove: false, rejectionReason: Not(IsNull()) };
//       break;
//     case "all":
//       filter = {}; // No filtering, retrieves all products
//       break;
//     default:
//       throw new Error("Invalid status filter");
//   }

//   const products = await ProductRepository.find({ where: filter });
//   return products;
// };

export const getProductsByFilter = async (status: string) => {
  let filter = {};

  switch (status) {
    case "pending":
      filter = {
        isProductApprove: false,
        rejectionReason: IsNull(),
        poststatus: Others.postStatus.SUBMITTED,
      };
      break;
    case "approved":
      filter = { isProductApprove: true };
      break;
    case "rejected":
      filter = { isProductApprove: false, rejectionReason: Not(IsNull()) };
      break;
    case "all":
      filter = {};
      break;
    default:
      throw new Error("Invalid status filter");
  }

  const products = await ProductRepository.find({
    where: filter,
    relations: ["user"],
    order: {
      createdAt: "DESC",
    },
  });
  return products;
};

export const getWithdrawalRequests = async (status: string) => {
  let filter = {};
  switch (status) {
    case "pending":
      filter = { isDeleted: false, withdrawlStatus: Others.withdrawalStatus.PENDING };
      break;
    case "approved":
      filter = { isDeleted: false, withdrawlStatus: Others.withdrawalStatus.APPROVED };
      break;
    case "rejected":
      filter = { isDeleted: false, withdrawlStatus: Others.withdrawalStatus.REJECTED };
      break;
    case "all":
      filter = { isDeleted: false };
      break;
    default:
      throw new Error("Invalid status filter");
  }

  const withdrawalRequests = await WithdrawlRepository.find({
    where: filter,
    relations: ["invoice"],
  });

  // Optionally transform the response
  const formattedRequests = withdrawalRequests.map((request) => ({
    id: request.id,
    status: request.withdrawlStatus,
    withdrawal: request.walletAddress,
    currency: request.currency,
    amount: request.amount,
    invoice: request.invoice ? { id: request.invoice.id, status: request.invoice.InvoiceStatus } : null,
  }));

  return formattedRequests;
};

export const approveWithdrawalRequest = async (withdrawalId: string) => {
  try {
    // Fetch the logged-in user by email
    //const user = await UserRepository.findOne({ where: { email: userEmail } });
    // if (!user) {
    //   throw new BadRequestError("Approving user not found");
    // }

    // Fetch the withdrawal request by ID
    const withdrawal = await WithdrawlRepository.findOne({
      where: { id: withdrawalId },
      relations: ["invoice"], // Include the related invoice
    });

    if (!withdrawal) {
      throw new BadRequestError("Withdrawal request not found");
    }

    // Ensure the withdrawal request is in a pending state
    if (withdrawal.withdrawlStatus !== Others.withdrawalStatus.PENDING) {
      throw new BadRequestError("Withdrawal request is not in a pending state");
    }

    // Approve the withdrawal request
    withdrawal.withdrawlStatus = Others.withdrawalStatus.APPROVED;
    withdrawal.approvalDate = new Date();
    // withdrawal.approvedBy = user; // Assign the full User object here

    // Update the related invoice status
    const invoice = withdrawal.invoice;
    if (!invoice) {
      throw new BadRequestError("No related invoice found for the withdrawal request");
    }
    invoice.InvoiceStatus = Others.invoiceStatus.APPROVED;

    // Save the updates
    await WithdrawlRepository.save(withdrawal);
    await InvoiceRepository.save(invoice);

    return {
      message: "Withdrawal request approved successfully",
      withdrawal,
      invoice,
    };
  } catch (error) {
    console.error("Error in approveWithdrawalRequest service:", error);
    throw new BadRequestError("Unable to approve withdrawal request");
  }
};

export const rejectWithdrawalRequest = async (withdrawalId: string) => {
  try {
    // Fetch the withdrawal request by ID
    const withdrawal = await WithdrawlRepository.findOne({
      where: { id: withdrawalId },
      relations: ["invoice"], // Include the related invoice
    });

    if (!withdrawal) {
      throw new BadRequestError("Withdrawal request not found");
    }

    // Ensure the withdrawal request is in a pending state
    if (withdrawal.withdrawlStatus !== Others.withdrawalStatus.PENDING) {
      throw new BadRequestError("Withdrawal request is not in a pending state");
    }

    // Reject the withdrawal request
    withdrawal.withdrawlStatus = Others.withdrawalStatus.REJECTED;

    // Update the related invoice status
    const invoice = withdrawal.invoice;
    console.log(invoice);
    if (!invoice) {
      throw new BadRequestError("No related invoice found for the withdrawal request");
    }
    invoice.InvoiceStatus = Others.invoiceStatus.REJECTED;

    // Save the updates
    await WithdrawlRepository.save(withdrawal);
    await InvoiceRepository.save(invoice);

    return {
      message: "Withdrawal request rejected successfully",
      withdrawal,
      invoice,
    };
  } catch (error) {
    console.error("Error in rejectWithdrawalRequest service:", error);
    throw new BadRequestError("Unable to reject withdrawal request");
  }
};

export const generatePayoutForApprovedRequests = async (withdrawalId: string, authToken: string) => {
  // Fetch the withdrawal request
  const withdrawalRequest = await WithdrawlRepository.findOne({
    where: { id: withdrawalId },
    relations: ["invoice"],
  });
  console.log("Fetched withdrawal:", withdrawalRequest);
  if (!withdrawalRequest) {
    throw new NotFoundError("Withdrawal request not found");
  }

  // Check if the request is approved
  if (withdrawalRequest.withdrawlStatus !== Others.withdrawalStatus.APPROVED) {
    throw new BadRequestError("Withdrawal request is not approved by admin");
  }

  // Prepare the payout payload
  const payoutPayload = {
    amount: withdrawalRequest.amount.toString(),
    currency: "USDT",
    order_id: withdrawalRequest.id.toString(),
    address: withdrawalRequest.walletAddress,
    url_callback: "https://backend.crective.com/api/orders/callback-payment",
    network: "TRON",
  };

  try {
    console.log("Sending payout request:", payoutPayload);

    // Make the payout request to Cryptomus API
    const payoutResponse = await axios.post("https://backend.crective.com/payscrap/create_payout", payoutPayload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer halwapuri`,
      },
    });

    // Verify the response
    if (!payoutResponse.data || payoutResponse.data.status !== "success") {
      console.error("Cryptomus API Error:", payoutResponse.data);
      throw new BadRequestError("Error processing payout request");
    }

    // Update the withdrawal request status in a transaction

    withdrawalRequest.withdrawlStatus = Others.withdrawalStatus.APPROVED;
    withdrawalRequest.approvalDate = new Date();
    await WithdrawlRepository.save(withdrawalRequest);

    console.log("Payout processed successfully:", payoutResponse.data);

    return {
      message: "Payout processed successfully",
      payoutResponse: payoutResponse.data,
    };
  } catch (err: any) {
    console.error("Payout Processing Error:", err);
    if (err.response?.data?.message?.includes("insufficient_credits")) {
      throw new BadRequestError("Admin has insufficient funds to process the payout.");
    }
    throw new BadRequestError(err.response?.data?.message || "Unexpected error while contacting the Cryptomus API.");
  }
};

export const deleteAdminAndModerators = async (adminId: string, superadminId: string) => {
  const admin = await UserRepository.findOne({
    where: { id: adminId, role: Others.role.ADMIN },
  });

  if (!admin) {
    throw new BadRequestError("Admin not found");
  }

  // Step 2: Find the moderators associated with this admin
  const moderators = await UserRepository.find({
    where: { referedBy: adminId, role: Others.role.MODERATOR }, // find moderators referred by this admin
  });

  if (moderators.length > 0) {
    // Step 3: Delete the moderators
    await UserRepository.remove(moderators);
  }

  // Step 4: Delete the admin
  await UserRepository.remove(admin);

  return { message: "Admin and associated moderators deleted successfully" };
};

export const softDeleteWithdrawalRequest = async (withdrawalId: string) => {
  try {
    // Validate withdrawalId
    if (!withdrawalId || typeof withdrawalId !== "string" || withdrawalId.trim() === "") {
      throw new BadRequestError("Invalid withdrawal ID provided");
    }

    // Fetch the withdrawal request by ID
    const withdrawal = await WithdrawlRepository.findOne({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      throw new NotFoundError("Withdrawal request not found");
    }

    // Set the deletedAt timestamp for soft deletion
    withdrawal.deletedAt = new Date();
    withdrawal.isDeleted = true;

    // Save the updated withdrawal record
    await WithdrawlRepository.save(withdrawal);

    return {
      message: "Withdrawal request soft-deleted successfully",
      withdrawalId,
    };
  } catch (error) {
    console.error("Error in softDeleteWithdrawalRequest service:", error);
    throw error; // Let the controller handle the error
  }
};

export const getUpdateRequests = async () => {
  try {
    const updateRequests = await ProductRepository.find({
      where: {
        isProductApprove: false,
        updateFields: Not(IsNull()), // Ensures updateFields is not null
      },
      relations: ["user"], // Include the user details if needed
    });

    return updateRequests;
  } catch (error) {
    throw error;
  }
};

export const approveEditRequest = async (productId: string) => {
  try {
    // Fetch the product with its updateFields
    const product = await ProductRepository.findOne({
      where: {
        id: productId,
        isProductApprove: false,
        updateFields: Not(IsNull()), // Ensure there are pending updates
      },
    });

    if (!product) {
      throw new Error("Product not found or no pending edit requests");
    }

    // Update product fields directly
    Object.assign(product, product.updateFields); // Merge updateFields into the product fields
    product.isProductApprove = true;
    (product.updateFields as any) = null; // Reset updateFields

    return await ProductRepository.save(product); // Return the updated product
  } catch (error) {
    throw error;
  }
};

export const rejectProductEditRequest = async (productId: string) => {
  try {
    const product = await ProductRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // Set isProductApprove to true and updateFields to null
    product.isProductApprove = true;
    (product.updateFields as any) = null;

    return await ProductRepository.save(product);
  } catch (error) {
    throw error;
  }
};

export async function deleteProductService(productId: string) {
  console.log("Finding product with ID:", productId);

  const product = await ProductRepository.findOne({ where: { id: productId } });

  if (!product) {
    throw new NotFoundError("Product not found");
  }

  console.log("Deleting product...");
  const deleteResult = await ProductRepository.delete(productId);

  console.log("Delete Result:", deleteResult);

  if (deleteResult.affected === 0) {
    throw new BadRequestError("Product could not be deleted");
  }

  console.log("Product deleted successfully");

  return { message: "Product deleted successfully" };
}

// update services
// export const updateProductService = async (
//   productId: string,
//   updateData: Partial<Product["updateFields"]>
// ) => {
//   try {
//     const product = await ProductRepository.findOne({
//       where: { id: productId },
//     });

//     if (!product) {
//       throw new BadRequestError("Product not found");
//     }

//     // ✅ Direct update karein bina kisi approval system ke
//     product.updateFields = { ...product.updateFields, ...updateData };

//     // ❌ Ensure karein ke `isProductApprove = false` yahan set na ho raha ho
//     // Agar `updateData` me `isProductApprove` a raha hai to usko hata dein
//     if ("isProductApprove" in updateData) {
//       delete updateData.isProductApprove;
//     }

//     Object.assign(product, updateData);

//     const updatedProduct = await ProductRepository.save(product);
//     return updatedProduct;
//   } catch (error) {
//     throw error;
//   }
// };

export const updateProductService = async (productId: string, updateData: Partial<Product["updateFields"]>) => {
  try {
    const product = await ProductRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new BadRequestError("Product not found");
    }

    console.log("Product Rejection Reason:", product.rejectionReason); // ✅ Debugging ke liye

    // ❌ Ensure ke `isProductApprove` update na ho
    if ("isProductApprove" in updateData) {
      delete updateData.isProductApprove;
    }

    // ✅ Check agar `rejectionReason` null ya empty string nahi hai to update allow na karein
    if (product.rejectionReason !== null && product.rejectionReason !== "") {
      throw new BadRequestError("Product cannot be updated as it has a rejection reason.");
    }

    Object.assign(product, updateData);

    const updatedProduct = await ProductRepository.save(product);
    return updatedProduct;
  } catch (error) {
    throw error;
  }
};

export const getAdminStats = async (userId: string) => {
  try {
    const currentYear = new Date().getFullYear();

    const getMonthDateRange = (month: number) => {
      const startOfMonth = new Date(currentYear, month, 1);
      const endOfMonth = new Date(currentYear, month + 1, 0);
      return { startOfMonth, endOfMonth };
    };

    // All-time stat queries in parallel
    const [
      approvedPublishersCount,
      pendingPublishersCount,
      approvedProductsCount,
      pendingProductsCount,
      rejectedProductsCount,
      approvedWithdrawalsCount,
      pendingWithdrawalsCount,
      rejectedWithdrawalsCount,
      moderatorCount,
    ] = await Promise.all([
      UserRepository.count({ where: { role: Others.role.PUBLISHER, isApproved: true } }),
      UserRepository.count({ where: { role: Others.role.PUBLISHER, isApproved: false, approvedby: IsNull() } }),
      ProductRepository.count({ where: { productStatus: Others.productstatus.APPROVED } }),
      ProductRepository.count({ where: { productStatus: Others.productstatus.PENDING } }),
      ProductRepository.count({ where: { productStatus: Others.productstatus.REJECTED } }),
      WithdrawlRepository.count({ where: { withdrawlStatus: Others.withdrawalStatus.APPROVED } }),
      WithdrawlRepository.count({ where: { withdrawlStatus: Others.withdrawalStatus.PENDING } }),
      WithdrawlRepository.count({ where: { withdrawlStatus: Others.withdrawalStatus.REJECTED } }),
      UserRepository.count({ where: { role: Others.role.MODERATOR, referedBy: userId } }),
    ]);

    const totalProductsCount = approvedProductsCount + pendingProductsCount + rejectedProductsCount;
    const totalWithdrawalsCount = approvedWithdrawalsCount + pendingWithdrawalsCount + rejectedWithdrawalsCount;
    const totalPublishers = approvedPublishersCount + pendingPublishersCount;

    // Monthly stats loop
    const monthlyStatsPromises = Array.from({ length: 12 }, async (_, month) => {
      const { startOfMonth, endOfMonth } = getMonthDateRange(month);

      const [
        approvedPublishersThisMonth,
        pendingPublishersThisMonth,
        approvedProductsThisMonth,
        pendingProductsThisMonth,
        rejectedProductsThisMonth,
      ] = await Promise.all([
        UserRepository.count({
          where: {
            role: Others.role.PUBLISHER,
            isApproved: true,
            createdAt: Between(startOfMonth, endOfMonth),
          },
        }),
        UserRepository.count({
          where: {
            role: Others.role.PUBLISHER,
            isApproved: false,
            approvedby: IsNull(),
            createdAt: Between(startOfMonth, endOfMonth),
          },
        }),
        ProductRepository.count({
          where: {
            productStatus: Others.productstatus.APPROVED,
            createdAt: Between(startOfMonth, endOfMonth),
          },
        }),
        ProductRepository.count({
          where: {
            productStatus: Others.productstatus.PENDING,
            createdAt: Between(startOfMonth, endOfMonth),
          },
        }),
        ProductRepository.count({
          where: {
            productStatus: Others.productstatus.REJECTED,
            createdAt: Between(startOfMonth, endOfMonth),
          },
        }),
      ]);

      return {
        month: month + 1,
        approvedPublishers: approvedPublishersThisMonth,
        pendingPublishers: pendingPublishersThisMonth,
        approvedProducts: approvedProductsThisMonth,
        pendingProducts: pendingProductsThisMonth,
        rejectedProducts: rejectedProductsThisMonth,
      };
    });

    const monthlyStats = await Promise.all(monthlyStatsPromises);

    return {
      totalPublishers,
      approvedPublishers: approvedPublishersCount,
      pendingPublishers: pendingPublishersCount,
      totalProducts: totalProductsCount,
      approvedProducts: approvedProductsCount,
      pendingProducts: pendingProductsCount,
      totalWithdrawals: totalWithdrawalsCount,
      approvedWithdrawals: approvedWithdrawalsCount,
      pendingWithdrawals: pendingWithdrawalsCount,
      totalModerators: moderatorCount,
      monthlyStats,
    };
  } catch (error) {
    console.error("Error fetching admin statistics:", error);
    throw error;
  }
};

export const getPublishersStats = async (userId: string) => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    // Function to get the start and end dates of a specific month in the year
    const getMonthDateRange = (month: number) => {
      const startOfMonth = new Date(currentYear, month, 1);
      const endOfMonth = new Date(currentYear, month + 1, 0);
      return { startOfMonth, endOfMonth };
    };

    // Fetch all-time counts for products
    const approvedProductsCount = await ProductRepository.count({
      where: {
        user: { id: userId },
        isProductApprove: true,
      },
    });

    const pendingProductsCount = await ProductRepository.count({
      where: {
        user: { id: userId },
        isProductApprove: false,
        rejectionReason: IsNull(),
      },
    });

    const totalProductsCount = approvedProductsCount + pendingProductsCount;

    // Fetch all-time counts for orders
    const allProducts = await ProductRepository.createQueryBuilder("product")
      .select("product.id")
      .where("product.userId = :userId", { userId })
      .getMany();

    const allProductIds = allProducts.map((p) => p.id);

    let totalOrdersCount = 0;
    let pendingOrdersCount = 0;
    let acceptedOrdersCount = 0;

    if (allProductIds.length > 0) {
      const allOrders = await OrderRepository.createQueryBuilder("order")
        .select("order")
        .where(
          `EXISTS (
            SELECT 1 FROM jsonb_array_elements(order.products) AS product
            WHERE (product->>'productId')::UUID IN (:...allProductIds)
            AND (product->>'publisherId')::UUID = :userId
          )`,
          { allProductIds, userId }
        )
        .getMany();

      totalOrdersCount = allOrders.length;
      pendingOrdersCount = allOrders.filter((order) => order.orderStatus === Others.orderStatus.PENDING).length;
      acceptedOrdersCount = allOrders.filter((order) => order.orderStatus === Others.orderStatus.APPROVED).length;
    }

    // Fetch monthly statistics for products and orders
    const monthlyStats = [];
    for (let month = 0; month < 12; month++) {
      const { startOfMonth, endOfMonth } = getMonthDateRange(month);

      // Fetch monthly product counts
      const approvedProductsThisMonth = await ProductRepository.count({
        where: {
          user: { id: userId },
          isProductApprove: true,
          createdAt: Between(startOfMonth, endOfMonth),
        },
      });

      const pendingProductsThisMonth = await ProductRepository.count({
        where: {
          user: { id: userId },
          isProductApprove: false,
          rejectionReason: IsNull(),
          createdAt: Between(startOfMonth, endOfMonth),
        },
      });

      const totalProductsThisMonth = approvedProductsThisMonth + pendingProductsThisMonth;

      // Fetch monthly order counts
      const productsThisMonth = await ProductRepository.createQueryBuilder("product")
        .select("product.id")
        .where("product.userId = :userId", { userId })
        .andWhere("product.createdAt BETWEEN :startOfMonth AND :endOfMonth", { startOfMonth, endOfMonth })
        .getMany();

      const productIdsThisMonth = productsThisMonth.map((p) => p.id);

      let totalOrdersThisMonth = 0;
      let pendingOrdersThisMonth = 0;
      let acceptedOrdersThisMonth = 0;

      if (productIdsThisMonth.length > 0) {
        const ordersThisMonth = await OrderRepository.createQueryBuilder("order")
          .select("order")
          .where(
            `EXISTS (
              SELECT 1 FROM jsonb_array_elements(order.products) AS product
              WHERE (product->>'productId')::UUID IN (:...productIdsThisMonth)
              AND (product->>'publisherId')::UUID = :userId
            )`,
            { productIdsThisMonth, userId }
          )
          .andWhere("order.createdAt BETWEEN :startOfMonth AND :endOfMonth", { startOfMonth, endOfMonth })
          .getMany();

        totalOrdersThisMonth = ordersThisMonth.length;
        pendingOrdersThisMonth = ordersThisMonth.filter(
          (order) => order.orderStatus === Others.orderStatus.PENDING
        ).length;
        acceptedOrdersThisMonth = ordersThisMonth.filter(
          (order) => order.orderStatus === Others.orderStatus.APPROVED
        ).length;
      }

      // Add monthly stats to the array
      monthlyStats.push({
        month: month + 1, // Months are 1-indexed (1 = January, 12 = December)
        totalProducts: totalProductsThisMonth,
        approvedProducts: approvedProductsThisMonth,
        pendingProducts: pendingProductsThisMonth,
        totalOrders: totalOrdersThisMonth,
        pendingOrders: pendingOrdersThisMonth,
        acceptedOrders: acceptedOrdersThisMonth,
      });
    }

    return {
      // All-time stats
      totalProducts: totalProductsCount,
      approvedProducts: approvedProductsCount,
      pendingProducts: pendingProductsCount,
      totalOrders: totalOrdersCount,
      pendingOrders: pendingOrdersCount,
      acceptedOrders: acceptedOrdersCount,

      // Monthly stats for the current year
      monthlyStats,
    };
  } catch (error) {
    console.error("Error fetching publisher statistics:", error);
    throw error;
  }
};

export const getProductsFromGoogleSheet = async (sheetId: string, user: User) => {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: "service_account",
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Sheet1",
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      throw new Error("No data found in the Google Sheet");
    }

    const products = rows.slice(1).map((row) => {
      const price = parseFloat(row[1]) || 0;
      const linkType =
        row[12] === "Do Follow" ? Others.linkType.DO_FOLLOW : Others.linkType.NO_FOLLOW;

      return {
        siteName: row[0],
        price: price,
        language: row[2],
        country: row[3],
        category: row[4]?.split(",").map((item: string) => item.trim()),
        currency: row[5],
        niche: row[6],
        ApproxPublicationTime: row[7],
        websiteUrl: row[8],
        siteType: row[9] || "newPost",
        sampleLink: row[10],
        liveTime: row[11] || null,
        linkType: linkType,
        maxLinkAllowed: row[13],
        Wordlimit: row[14],
        domainAuthority: parseInt(row[15], 10) || 0,
        domainRatings: parseFloat(row[16]) || 0,
        monthlyTraffic: parseInt(row[17], 10) || 0,
        turnAroundTime: "2 days",
        adjustedPrice: price * 1.25,
        isProductApprove: true,
        productStatus: Others.productstatus.APPROVED,
        user,
      };
    });

    console.log("Products to save:", products);
    return await ProductRepository.save(products);
  } catch (error) {
    console.error("Error in getProductsFromGoogleSheet:", error);
    throw new Error("Failed to save products to the database");
  }
};

// Utility function to extract Sheet ID from the URL
export const extractSheetId = (url: string): string | null => {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
};

export const getAllCategoriesService = () => {
  // Extract all category values from the enum
  return Object.values(Others.category);
};

export const getAllPermissionService = () => {
  // Extract all category values from the enum
  return Object.values(Others.permissions);
};

export const approveBulkProducts = async (
  adminId: string,
  bulkApproveInput: {
    productIds: string[];
    monthlyTraffic: number;
    domainRatings: number;
    domainAuthority: number;
  }
) => {
  try {
    console.log("Bulk Approve Products function called", { adminId, bulkApproveInput });

    const admin = await UserRepository.findOne({ where: { id: adminId } });
    if (!admin) {
      throw new NotFoundError("Admin not found");
    }

    // Find all products at once
    const products = await ProductRepository.find({
      where: { id: In(bulkApproveInput.productIds) },
      relations: ["user"],
    });

    if (products.length !== bulkApproveInput.productIds.length) {
      const foundIds = products.map((p) => p.id);
      const missingIds = bulkApproveInput.productIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundError(`Some products not found. Missing IDs: ${missingIds.join(", ")}`);
    }

    // Prepare update data
    const updateData = {
      isProductApprove: true,
      domainRatings: bulkApproveInput.domainRatings,
      domainAuthority: bulkApproveInput.domainAuthority,
      monthlyTraffic: bulkApproveInput.monthlyTraffic,
      productHandeledBy: admin.email,
      productStatus: Others.productstatus.APPROVED,
      approvedAt: new Date(),
    };

    // Bulk update products
    await ProductRepository.update({ id: In(bulkApproveInput.productIds) }, updateData);

    // Send emails to all users (optional, could be done in background job)
    const emailPromises = products
      .filter((product) => product.user?.email)
      .map((product) =>
        sendEmail({
          toEmail: product.user.email,
          subject: "Publisher Request Approved",
          text: `Your product has been approved.`,
        }).catch((err) => console.error(`Failed to send email to ${product.user.email}`, err))
      );

    await Promise.all(emailPromises);

    console.log("Bulk product approval completed successfully", {
      count: products.length,
    });

    return {
      message: `Successfully approved ${products.length} products`,
      data: { count: products.length },
    };
  } catch (error) {
    console.error("Error in approveBulkProducts function", { error });
    throw error;
  }
};

export const rejectBulkProducts = async (
  adminId: string,
  bulkRejectInput: {
    productIds: string[];
    rejectionReason: string;
  }
) => {
  try {
    console.log("Bulk Reject Products function called", { adminId, bulkRejectInput });

    const admin = await UserRepository.findOne({ where: { id: adminId } });
    if (!admin) {
      throw new NotFoundError("Admin not found");
    }

    if (!bulkRejectInput.rejectionReason) {
      throw new BadRequestError("Missing rejection reason");
    }

    // Find all products at once
    const products = await ProductRepository.find({
      where: { id: In(bulkRejectInput.productIds) },
      relations: ["user"],
    });

    if (products.length !== bulkRejectInput.productIds.length) {
      const foundIds = products.map((p) => p.id);
      const missingIds = bulkRejectInput.productIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundError(`Some products not found. Missing IDs: ${missingIds.join(", ")}`);
    }

    // Check if any product is already approved
    const alreadyApproved = products.filter((p) => p.isProductApprove);
    if (alreadyApproved.length > 0) {
      throw new BadRequestError(
        `Cannot reject already approved products: ${alreadyApproved.map((p) => p.id).join(", ")}`
      );
    }

    // Prepare update data
    const updateData = {
      isProductApprove: false,
      rejectionReason: bulkRejectInput.rejectionReason,
      productHandeledBy: admin.email,
      productStatus: Others.productstatus.REJECTED,
    };

    // Bulk update products
    await ProductRepository.update({ id: In(bulkRejectInput.productIds) }, updateData);

    // Send emails to all users (optional, could be done in background job)
    const emailPromises = products
      .filter((product) => product.user?.email)
      .map((product) =>
        sendEmail({
          toEmail: product.user.email,
          subject: "Publisher Request Rejected",
          text: `Your product has been rejected. Reason: ${bulkRejectInput.rejectionReason}`,
        }).catch((err) => console.error(`Failed to send email to ${product.user.email}`, err))
      );

    await Promise.all(emailPromises);

    console.log("Bulk product rejection completed successfully", {
      count: products.length,
    });

    return {
      message: `Successfully rejected ${products.length} products`,
      data: { count: products.length },
    };
  } catch (error) {
    console.error("Error in rejectBulkProducts function", { error });
    throw error;
  }
};

export const getAllUser = async () => {
  const allUsers = await UserRepository.find({
    where: { role: Others.role.USER },
    select: [
      "id",
      "email",
      "firstName",
      "lastName",
      "phoneNo",
      "currency",
      "country",
      "city",
      "postalCode",
      "monthlyBudget",
    ],
  });
  // console.log("alll", allUsers);

  return allUsers;
};

export const getAllAdmins = async (role: Others.role) => {
  const allAdmins = await UserRepository.find({ where: { role }, select: ["email"] });
  return allAdmins;
};

export const deleteUser = async (userId: string): Promise<void> => {
  return await UserRepository.manager.transaction(async (transactionalEntityManager) => {
    try {
      // 1. Verify user exists
      const userExists = await transactionalEntityManager.findOne(User, {
        where: { id: userId },
        select: ["id"],
      });

      if (!userExists) {
        throw new Error(`User with ID ${userId} not found`);
      }

      console.log(`Starting deletion process for user ${userId}`);

      // 2. Delete order invoices (direct user reference)
      const invoiceDeleteResult = await transactionalEntityManager.delete(OrderInvoice, {
        user: { id: userId },
      });
      console.log(`Deleted ${invoiceDeleteResult.affected} order invoices`);

      // 3. Delete orders and their associated invoices
      const userOrders = await transactionalEntityManager.find(Order, {
        where: { user: { id: userId } },
        select: ["id"],
      });

      if (userOrders.length > 0) {
        // Delete invoices for these orders
        const orderIds = userOrders.map((o: Order) => o.id);
        await transactionalEntityManager.delete(OrderInvoice, {
          order: In(orderIds),
        });

        // Then delete the orders
        const orderDeleteResult = await transactionalEntityManager.delete(Order, {
          id: In(orderIds),
        });
        console.log(`Deleted ${orderDeleteResult.affected} orders`);
      }

      // 4. Delete other user-related entities
      await Promise.all([
        transactionalEntityManager.delete(Withdrawl, { user: { id: userId } }),
        transactionalEntityManager.delete(Product, { user: { id: userId } }),
        transactionalEntityManager.delete(Cart, { user: { id: userId } }),
      ]);

      // 5. Finally delete the user
      await transactionalEntityManager.delete(User, userId);
      console.log(`Successfully deleted user ${userId}`);
    } catch (error) {
      console.error("Transaction failed:", error);
      throw new Error(`User deletion failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
};

export const editUser = async (userId: string, updateData: UpdateUserDetail) => {
  try {
    // 1. Find the user
    const user = await UserRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // 2. Apply updates
    Object.assign(user, updateData);

    // 4. Save the updated user
    const updatedUser = await UserRepository.save(user);

    // Return the updated user without sensitive data
    const { password, otp, otpExpiresAt, resetPasswordToken, resetPasswordExpiresAt, ...safeUser } = updatedUser;
    return safeUser;
  } catch (error) {
    console.error("Error updating user:", error);
    throw new Error(`Failed to update user: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};
