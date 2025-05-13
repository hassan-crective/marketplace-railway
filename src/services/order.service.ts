import { WordLimitPrice } from "./../utils/wordPrice";
import { NotFoundError } from "../errors/notFound.error";
import { OrderInvoiceRepository, OrderRepository, ProductRepository, UserRepository } from "../repositories";
import { getOrderSortPaging, getSortPaging } from "../utils/sortPagination";
import { Order } from "../models/orders";
import { Others } from "../enums/others.enum";
import {
  CreateUserOrderSchema,
  RequestOrderToPublisherSchema,
  UpdateUserProfileSchema,
} from "../validators/order.validation";
import { ILike, In, Raw } from "typeorm";
import { Status } from "../enums/status.enum";
import { generateOrderNumber } from "../utils/orderNumber";
import { getCommissionRate } from "../utils/commissionRate";
import { BadRequestError } from "../errors/badRequest.error";
import { generateInvoiceNumber } from "../utils/gernrateInvoice";
import { processPayment } from "../utils/payment";
import { User } from "../models/user";
import { sendAdminEmailForPendingOrder, sendEmail } from "../utils/emails";
import { sendOrderStatusNotification } from "../utils/orderStatusNotification";
import { OrderInvoice } from "../models/orderInvoice";
import { getAllAdmins } from "./admin.services";

interface OrderProduct {
  productId: string;
}

interface CreateOrderData {
  backupEmail?: string;
  fileUrl?: string;
  products: OrderProduct[];
  paymentType: "Payoneer" | "Cryptomus";
}

interface PublisherOrderData extends CreateOrderData {
  anchorLink?: string;
  anchor?: string;
  wordLimit?: Others.wordLimit;
  notes?: string;
}

export const createOrder = async (userId: string, data: CreateOrderData): Promise<Order> => {
  const validatedData = CreateUserOrderSchema.parse(data);

  const user = await UserRepository.findOne({ where: { id: userId } });
  if (!user) throw new NotFoundError("User not found");

  const productIds = validatedData.products.map((p) => p.productId);
  const products = await ProductRepository.find({
    where: { id: In(productIds) },
    relations: ["user"],
  });

  if (products.length !== validatedData.products.length) {
    const missingIds = productIds.filter((id) => !products.some((p) => p.id === id));
    throw new NotFoundError(`Products not found: ${missingIds.join(", ")}`);
  }

  const totalAmount = Math.floor(products.reduce((total, product) => total + Number(product.adjustedPrice), 0));
  const orderNo = generateOrderNumber();
  const currency = products[0].currency;

  const { network, to_currency } = validatedData;
  const orderProducts = products.map((product) => ({
    productId: product.id,
    siteName: product.siteName,
    websiteURL: product.websiteUrl,
    adjustedPrice: product.adjustedPrice,
    category: product.category,
    niche: product.niche,
    turnAroundTime: product.turnAroundTime,
    language: product.language,
    currency: product.currency,
    publisherId: product.user.id,
    monthlyTraffic: product.monthlyTraffic,
    domainRatings: product.domainRatings,
    domainAuthority: product.domainAuthority,
    price: product.price,
  }));

  let orderData: Partial<Order> = {
    user: { id: userId } as User,
    totalAmount,
    orderNumber: orderNo,
    contentProvidedBy: Others.contentProvidedBy.USER,
    backupEmail: validatedData.backupEmail,
    file: validatedData.file,
    notes: validatedData.notes,
    products: orderProducts,
    orderStatus: Status.orderStatus.PENDING,
    anchorLink: validatedData.anchorLink,
    anchor: validatedData.anchor,
    network: validatedData.network,
    to_currency: validatedData.to_currency,
    paymentType: validatedData.paymentType,
  };

  if (data.paymentType === "Payoneer") {
    orderData.txid = validatedData.transactionId; // <--- from user
  } else {
    const paymentResponse = await processPayment(orderNo, totalAmount, currency, network, to_currency);
    const {
      url,
      uuid,
      expired_at,
      payment_status,
      address_qr_code,
      payer_amount,
      merchant_amount,
      address,
      payer_currency,
    } = paymentResponse;

    Object.assign(orderData, {
      url,
      uuid,
      expired_at,
      payment_status,
      address_qr_code,
      address,
      payer_currency,
      payer_amount: payer_amount ? Number(payer_amount) : undefined,
    });
  }

  const order = OrderRepository.create(orderData);

  const invoiceNumber = generateInvoiceNumber();
  const publisherName = user.firstName;
  const orderInvoice = OrderInvoiceRepository.create({
    invoiceNumber,
    publisherName,
    orderNumber: orderNo.toString(),
    amount: totalAmount,
    currency: currency,
    user: { id: userId } as User,
    order: order,
  });

  await OrderInvoiceRepository.save(orderInvoice);
  await OrderRepository.save(order);

  if (validatedData.backupEmail) {
    await sendEmail({
      toEmail: validatedData.backupEmail,
      subject: "Your Order Has Been Created!",
      text: `Your Order No ${order.orderNumber} has been created successfully.`,
    });
  }
  if (data.paymentType === "Cryptomus") {
    const allAdminsPubs = await getAllAdmins(Others.role.SUPERADMIN);
    const getAllPublishers = await getAllPublishersOfOrder(order.id);
    // send email to admins
    await sendAdminEmailForPendingOrder(
      {
        admins: [...allAdminsPubs, ...getAllPublishers],
        subject: `New Pending Order #${orderNo}`,
        text: `Order #${orderNo} from ${user.firstName} ${user.lastName} is pending processing.`,
      },
      Others.role.ADMIN
    );
  } else {
    const allAdmins = await getAllAdmins(Others.role.SUPERADMIN);
    // send email to admins
    await sendAdminEmailForPendingOrder(
      {
        admins: allAdmins,
        subject: `New Pending Order #${orderNo}`,
        text: `Order #${orderNo} from ${user.firstName} ${user.lastName} is pending processing.`,
      },
      Others.role.ADMIN
    );
  }
  return order;
};

export const requestOrderToPublisher = async (userId: string, data: PublisherOrderData): Promise<Order> => {
  const validatedData = RequestOrderToPublisherSchema.parse(data);

  const publisher = await UserRepository.findOne({
    where: { id: userId },
    relations: ["orders"],
  });

  if (!publisher) throw new NotFoundError("Publisher not found");

  const productIds = validatedData.products.map((p) => p.productId);
  const products = await ProductRepository.findBy({ id: In(productIds) });

  if (products.length !== validatedData.products.length) {
    const missingIds = productIds.filter((id) => !products.some((p) => p.id === id));
    throw new NotFoundError(`Products not found: ${missingIds.join(", ")}`);
  }

  const baseAmount = Math.floor(products.reduce((total, product) => total + Number(product.adjustedPrice), 0));

  const orderNo = generateOrderNumber();
  const currency = products[0].currency;

  const orderProducts = products.map((product) => ({
    productId: product.id,
    siteName: product.siteName,
    price: product.price,
    adjustPrice: product.adjustedPrice,
    category: product.category,
    niche: Others.niche.CRYPTO,
    turnAroundTime: product.turnAroundTime,
    language: product.language,
    currency: product.currency,
    monthlyTraffic: product.monthlyTraffic,
    domainRatings: product.domainRatings,
    domainAuthority: product.domainAuthority,
  }));

  let affiliateCommissions = 0;
  const commissionRate = getCommissionRate();
  affiliateCommissions = Math.floor(baseAmount * commissionRate);

  let wordLimitPrice = 0;
  if (validatedData.wordLimit === Others.wordLimit.W650) {
    wordLimitPrice = WordLimitPrice.Word650;
  } else if (validatedData.wordLimit === Others.wordLimit.W750) {
    wordLimitPrice = WordLimitPrice.Word750;
  } else if (validatedData.wordLimit === Others.wordLimit.W850) {
    wordLimitPrice = WordLimitPrice.Word850;
  }

  const totalAmount = Math.floor(baseAmount + wordLimitPrice);

  const { network, to_currency } = validatedData;

  const paymentResponse = await processPayment(orderNo, totalAmount, currency, network, to_currency);
  const {
    url,
    uuid,
    expired_at,
    payment_status,
    address_qr_code,
    payer_amount,
    merchant_amount,
    address,
    payer_currency,
  } = paymentResponse;
  console.log("payemntResponse ::", paymentResponse);
  const order = OrderRepository.create({
    user: { id: userId } as User,
    totalAmount: parseInt(totalAmount.toString(), 10),
    orderNumber: orderNo,
    contentProvidedBy: Others.contentProvidedBy.PUBLISHER,
    backupEmail: validatedData.backupEmail,
    anchorLink: validatedData.anchorLink,
    anchor: validatedData.anchor,
    wordLimit: validatedData.wordLimit,
    notes: validatedData.notes,
    products: orderProducts,
    orderStatus: Status.orderStatus.PENDING,
    url,
    uuid,
    expired_at,
    payment_status,
    affiliateComission: parseInt(affiliateCommissions.toString(), 10),
    address_qr_code,
    network: validatedData.network,
    to_currency: validatedData.to_currency,
    payer_amount: payer_amount ? Number(payer_amount) : undefined,
    payer_currency,
    address,
    paymentType: validatedData.paymentType,
  });

  const invoiceNumbers = generateInvoiceNumber();
  const publisherName = publisher.firstName;

  const orderInvoice = OrderInvoiceRepository.create({
    invoiceNumber: invoiceNumbers,
    publisherName,
    orderNumber: orderNo.toString(),
    amount: parseInt(totalAmount.toString(), 10),
    currency: currency,
    user: { id: userId } as User,
    order: order,
  });

  await OrderInvoiceRepository.save(orderInvoice);
  await OrderRepository.save(order);

  if (validatedData.backupEmail) {
    await sendEmail({
      toEmail: validatedData.backupEmail,
      subject: "Your Order Has Been Accepted!",
      text: `Your Order No ${order.orderNumber} has been created successfully.`,
    });
  }

  return order;
};

export const findAllOrders = async (userId: string, query: any) => {
  const queryObject: any = { user: { id: userId } };

  if (query.contentProvidedBy) {
    queryObject.contentProvidedBy = query.contentProvidedBy;
  }

  if (query.orderStatus) {
    queryObject.orderStatus = query.orderStatus;
  }

  if (query.orderNumber) {
    queryObject.orderNumber = Number(query.orderNumber);
  }
  const { sort, skip, limit } = getSortPaging(query);

  let whereCondition: any = queryObject;
  if (query.q) {
    const searchValue = `%${query.q}%`;
    whereCondition = [
      { ...queryObject, orderNumber: Raw((alias) => `CAST(${alias} AS TEXT) ILIKE :search`, { search: searchValue }) },
      { ...queryObject, backupEmail: ILike(searchValue) },
      { ...queryObject, totalAmount: Raw((alias) => `CAST(${alias} AS TEXT) ILIKE :search`, { search: searchValue }) },
    ];
  }

  const [items, total] = await OrderRepository.findAndCount({
    where: whereCondition,
    relations: ["user"],
    select: {
      user: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        postalCode: true,
        country: true,
        city: true,
        phoneNo: true,
      },
    },
    order: sort,
    skip,
    take: limit,
  });

  return {
    total,
    items,
    page: query.page,
    limit: query.limit,
  };
};

export const findAllOrdersAdmin = async (query: any) => {
  const queryObject: any = {};

  if (query.orderStatus) {
    queryObject.orderStatus = query.orderStatus;
  }

  const { sort, skip, limit } = getSortPaging(query);

  let whereCondition: any = queryObject;

  if (query.q) {
    const searchValue = `%${query.q}%`;
    whereCondition = [
      { ...queryObject, orderNumber: Raw((alias) => `CAST(${alias} AS TEXT) ILIKE :search`, { search: searchValue }) },
      { ...queryObject, backupEmail: ILike(searchValue) },
      { ...queryObject, totalAmount: Raw((alias) => `CAST(${alias} AS TEXT) ILIKE :search`, { search: searchValue }) },
    ];
  }

  const [items, total] = await OrderRepository.findAndCount({
    where: whereCondition,
    relations: ["user"],
    select: {
      user: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    },
    order: sort,
    skip,
    take: limit,
  });

  return {
    total,
    items,
    page: query.page,
    limit: query.limit,
  };
};

export const findOrderById = async (id: string) => {
  const order = await OrderRepository.findOne({
    where: { id },
    relations: ["user"],
  });

  if (!order) throw new NotFoundError("Order not found");
  return order;
};

export const updateAcceptedOrder = async (userId: string, orderId: string) => {
  const order = await OrderRepository.findOne({
    where: { id: orderId },
    relations: ["user"],
  });

  const invoice = await OrderInvoiceRepository.findOne({
    where: { orderNumber: order?.orderNumber.toString() }, // Query the orderNumber column in OrderInvoice
  });

  console.log("invoice", invoice);

  if (!order) {
    throw new BadRequestError("Order not found");
  }

  const product = order.products?.[0];
  if (!product) throw new NotFoundError("No product found in the order");

  const publisherId = product.publisherId;
  const adjustedPrice = Number(product.adjustedPrice);

  if (!publisherId) throw new NotFoundError("Publisher ID not found");
  if (isNaN(adjustedPrice)) throw new Error("Invalid adjusted price");

  await OrderRepository.manager.transaction(async (transactionalEntityManager) => {
    const publisher = await transactionalEntityManager.findOne(User, {
      where: { id: publisherId },
    });

    if (!publisher) throw new NotFoundError("Publisher not found");

    const currentBalance = parseFloat(publisher.walletBalance as any) || 0;

    const updatedBalance = Math.round(currentBalance + adjustedPrice);

    await transactionalEntityManager.update(User, publisher.id, { walletBalance: updatedBalance });
    order.orderStatus = Others.orderStatus.APPROVED;
    order.handeledBy = userId;

    // Updating the OrderInvoice status here:
    if (invoice) {
      invoice.orderInvoice = Others.orderinvoiceStatus.APPROVED; // Set the status to ACCEPTED
      await transactionalEntityManager.save(OrderInvoice, invoice); // Save the updated OrderInvoice
      console.log("orderInvoice successfully updated:", invoice);
    }
    console.log("orderInvoice successully updated");
    await transactionalEntityManager.save(order);
  });

  if (order.backupEmail) {
    await sendOrderStatusNotification(order.orderNumber, Others.orderStatus.APPROVED, order.backupEmail, {});
  }

  return { message: "Order Accepted successfully, Wallet Updated, Email Sent!" };
};

export const updateRejectedOrder = async (userId: string, orderId: string, rejectionReason: string) => {
  const order = await OrderRepository.findOne({
    where: { id: orderId },
    relations: ["user"],
  });

  const invoice = await OrderInvoiceRepository.findOne({
    where: { orderNumber: order?.orderNumber.toString() }, // Query the orderNumber column in OrderInvoice
  });

  console.log("invoice", invoice);

  if (!order) {
    throw new BadRequestError("Order not found");
  }

  const product = order.products?.[0];
  if (!product) throw new NotFoundError("No product found in the order");

  const publisherId = product.publisherId;
  const adjustedPrice = Number(product.adjustedPrice);

  if (!publisherId) throw new NotFoundError("Publisher ID not found");
  if (isNaN(adjustedPrice)) throw new Error("Invalid adjusted price");

  await OrderRepository.manager.transaction(async (transactionalEntityManager) => {
    const publisher = await transactionalEntityManager.findOne(User, {
      where: { id: publisherId },
    });

    if (!publisher) throw new NotFoundError("Publisher not found");
    order.orderStatus = Others.orderStatus.REJECTED;
    order.handeledBy = userId;
    order.rejectionReason = rejectionReason;

    // Updating the OrderInvoice status here:
    if (invoice) {
      invoice.orderInvoice = Others.orderinvoiceStatus.REJECTED; // Set the status to ACCEPTED
      await transactionalEntityManager.save(OrderInvoice, invoice); // Save the updated OrderInvoice
      console.log("orderInvoice successfully updated:", invoice);
    }
    console.log("orderInvoice successully updated");
    await transactionalEntityManager.save(order);
  });

  if (order.backupEmail) {
    await sendOrderStatusNotification(order.orderNumber, Others.orderStatus.APPROVED, order.backupEmail, {});
  }

  return { message: "Order Rejected , Email Sent!" };
};

// export const updateRejectedOrder = async (userId: string, orderId: string, rejectionReason: string) => {
//   console.log("Attempting to find order with ID:", orderId);
//   const order = await OrderRepository.findOne({
//     where: { id: orderId },
//     relations: ["user"],
//   });

//   if (!order) {
//     console.log("No order found with ID:", orderId);  // Debugging log
//     throw new BadRequestError("Order not found");
//   }

//   const backupEmail = order.backupEmail;
//   order.orderStatus = Others.orderStatus.REJECTED;
//   order.handeledBy = userId;
//   order.rejectionReason = rejectionReason;
//   await OrderRepository.save(order);

//   if (backupEmail) {
//     await sendOrderStatusNotification(
//       order.orderNumber,
//       Others.orderStatus.REJECTED,
//       backupEmail,
//       { rejectionReason }
//     );
//   }

//   return { message: "Order rejected successfully" };
// };

export const updateSubmitedOrder = async (
  userId: string,
  orderId: string,
  submissionUrl: string,
  submissionDetails: string
) => {
  const order = await OrderRepository.findOne({
    where: { id: orderId },
    relations: ["user"],
  });

  if (!order) {
    throw new BadRequestError("Order not found");
  }

  const invoice = await OrderInvoiceRepository.findOne({
    where: { orderNumber: order?.orderNumber.toString() }, // Query the orderNumber column in OrderInvoice
  });

  console.log("invoice", invoice);

  const backupEmail = order.backupEmail;
  order.orderStatus = Others.orderStatus.SUBMITTED;
  order.handeledBy = userId;
  order.submissionUrl = submissionUrl;
  order.submissionDetails = submissionDetails;
  order.submissionDate = new Date();
  if (invoice) {
    invoice.orderInvoice = Others.orderinvoiceStatus.SUBMITTED; // Set the status to ACCEPTED
    await OrderInvoiceRepository.save(invoice); // Save the updated OrderInvoice
    console.log("orderInvoice successfully updated:", invoice);
  }
  console.log("orderInvoice successully updated");
  await OrderRepository.save(order);

  if (backupEmail) {
    await sendOrderStatusNotification(order.orderNumber, Others.orderStatus.SUBMITTED, backupEmail, {
      submissionUrl,
      submissionDetails,
    });
  }

  return { message: "Order submitted successfully" };
};

export const deleteOrderAdmin = async (id: string) => {
  const order = await OrderRepository.findOne({
    where: { id },
  });

  if (!order) {
    throw new NotFoundError("Order not found");
  }
  const backupEmail = order.backupEmail;
  const orderNumber = order.orderNumber;

  // Notify user before deleting the order
  if (backupEmail) {
    // Using a custom message for deletion as it's not a status change
    await sendEmail({
      toEmail: backupEmail,
      subject: "Your Order Has Been Deleted",
      text: `Your Order #${orderNumber} has been deleted by the administrator.`,
    });
  }

  await OrderRepository.remove(order);

  return { message: "Order deleted successfully" };
};

export const updateOrderStatus = async (
  orderId: string,
  orderStatus: string,
  submissionUrl: string,
  submissionDetails: string
) => {
  const order = await OrderRepository.findOne({
    where: { id: orderId },
    relations: ["user", "products"],
  });

  if (!order) {
    throw new BadRequestError("Order not found");
  }
  Others.orderStatus;
  orderStatus;
  order.submissionUrl = submissionUrl;
  order.submissionDetails = submissionDetails;
  await OrderRepository.save(order);
  return { message: "Order updated successfully" };
};

export const updateOrderByIds = async (orderId: string, userId: string, orderStatus: Others.orderStatus) => {
  const order = await OrderRepository.findOne({
    where: { id: orderId },
    relations: ["user"],
  });

  if (!order) {
    throw new BadRequestError("Order not found");
  }

  if (!userId) {
    throw new BadRequestError("Unauthorized: You can't update this order");
  }

  // Update order status
  order.orderStatus = orderStatus;
  order.handeledBy = userId;

  await OrderRepository.save(order);

  // Get the user's email from the order or use backupEmail if available
  const recipientEmail = order.backupEmail || order.user?.email;

  if (recipientEmail) {
    // Send notification about status change
    await sendOrderStatusNotification(order.orderNumber, orderStatus, recipientEmail, {
      rejectionReason: order.rejectionReason,
      submissionDetails: order.submissionDetails,
      submissionUrl: order.submissionUrl,
    });
  }

  return {
    message: "Order updated successfully",
    order,
  };
};

export const SuperAdminAccept = async (orderId: string, adminEmail: string) => {
  const order = await OrderRepository.findOne({
    where: { id: orderId },
    relations: ["user"],
  });

  if (!order) throw new NotFoundError("Order not found");

  const product = order.products?.[0];
  if (!product) throw new NotFoundError("No product found in the order");

  const publisherId = product.publisherId;
  const adjustedPrice = Number(product.adjustedPrice);

  if (!publisherId) throw new NotFoundError("Publisher ID not found");
  if (isNaN(adjustedPrice)) throw new Error("Invalid adjusted price");

  order.orderStatus = Status.orderStatus.APPROVED;
  order.handeledBy = adminEmail;
  await OrderRepository.manager.transaction(async (transactionalEntityManager) => {
    await transactionalEntityManager.save(order);
    const publisher = await transactionalEntityManager.findOne(User, {
      where: { id: publisherId },
    });

    if (!publisher) throw new NotFoundError("Publisher not found");
    const currentBalance = parseFloat(publisher.walletBalance as any) || 0;

    const updatedBalance = Math.round(currentBalance + adjustedPrice);

    await transactionalEntityManager.update(User, publisher.id, { walletBalance: updatedBalance });
  });

  // Send email notification if backup email is available
  if (order.backupEmail) {
    await sendOrderStatusNotification(order.orderNumber, Status.orderStatus.APPROVED, order.backupEmail, {});
  }

  return await OrderRepository.findOne({
    where: { id: orderId },
    relations: ["user"],
  });
};

export const SuperAdminReject = async (orderId: string, rejectionReason: string, adminEmail: string) => {
  const order = await OrderRepository.findOne({
    where: { id: orderId },
    relations: ["user"],
  });

  if (!order) {
    throw new NotFoundError("Order not found");
  }

  order.orderStatus = Status.orderStatus.REJECTED;
  order.handeledBy = adminEmail;
  order.rejectionReason = rejectionReason;

  await OrderRepository.manager.transaction(async (transactionalEntityManager) => {
    await transactionalEntityManager.save(Order, order);
  });

  // Send email notification if backup email is available
  if (order.backupEmail) {
    await sendOrderStatusNotification(order.orderNumber, Status.orderStatus.REJECTED, order.backupEmail, {
      rejectionReason,
    });
  }

  return OrderRepository.findOne({
    where: { id: orderId },
    relations: ["user"],
  });
};

export const getPublisherOrders = async (userId: string, query: any) => {
  // Fetch the products associated with the publisher (user)
  const products = await ProductRepository.createQueryBuilder("product")
    .select("product.id")
    .where("product.userId = :userId", { userId })
    .getMany();
  const productIds = products.map((p) => p.id);
  // If no products exist for this publisher, return an empty result
  if (productIds.length === 0) {
    return { total: 0, items: [] };
  }
  // Extract pagination, sorting, and status filter from the query
  const { sort, skip, limit, status } = getOrderSortPaging(query);
  // Fetch the orders associated with the publisher and the selected products
  const [items, total] = await OrderRepository.createQueryBuilder("order")
    .leftJoinAndSelect("order.user", "user")
    .where(
      `EXISTS (
        SELECT 1 FROM jsonb_array_elements(order.products) AS product
        WHERE (product->>'productId')::UUID IN (:...productIds) -- Ensure UUID match
        AND (product->>'publisherId')::UUID = :userId -- Ensure publisher ID match
      )`,
      { productIds, userId }
    )
    .andWhere("order.payment_status = :paidStatus", { paidStatus: "paid" })
    .andWhere(status ? "order.payment_status = :status" : "1=1", { status }) // Add status filter
    .orderBy("order.createdAt", "DESC")
    .skip(skip) // Apply pagination skip
    .take(limit) // Apply pagination limit
    .getManyAndCount(); // Get the items and total count of orders
  // Return the paginated response along with total count, page, and limit
  return {
    total,
    items,
    page: query.page,
    limit: query.limit,
  };
};

export const processCryptomusCallback = async (uuid: string, payment_status: string, txid?: string) => {
  let updatedStatus = Others.orderStatus.PENDING;

  if (payment_status.toLowerCase() === "paid") {
    updatedStatus = Others.orderStatus.COMPLETED;
  } else if (payment_status.toLowerCase() === "check") {
    updatedStatus = Others.orderStatus.UNPAID;
  } else if (payment_status.toLowerCase() === "canceled" || payment_status.toLowerCase() === "cancelled") {
    updatedStatus = Others.orderStatus.REJECTED;
  }

  return await OrderRepository.update(
    { uuid },
    {
      payment_status: updatedStatus,
      ...(txid && { txid }),
    }
  );
};

//update Profile info for order

export const updateUserProfileForOrder = async (userId: string, data: any): Promise<User> => {
  const validatedData = UpdateUserProfileSchema.parse(data);

  const user = await UserRepository.findOne({ where: { id: userId } });
  if (!user) throw new NotFoundError("User not found");

  Object.assign(user, validatedData);
  return await UserRepository.save(user);
};

export const getOrdersOnPaymentType = async (paymentType: string) => {
  const allOrder = await OrderRepository.find({ where: { paymentType } });
  return allOrder;
};

export const bulkDeleteOrdersAdmin = async (orderIds: string[]) => {
  // 1. Simple UUID validation
  const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

  // 2. Validate all IDs
  const invalidIds = orderIds.filter((id) => !isValidUUID(id));
  if (invalidIds.length > 0) {
    throw new Error(`Invalid order IDs: ${invalidIds.join(", ")}`);
  }

  // 3. Find orders using correct syntax
  const orders = await OrderRepository.findBy({
    id: In(orderIds),
  });

  // 4. Check if all orders exist
  if (orders.length !== orderIds.length) {
    const foundIds = orders.map((o) => o.id);
    const missingIds = orderIds.filter((id) => !foundIds.includes(id));
    throw new Error(`Orders not found: ${missingIds.join(", ")}`);
  }

  // 5. Delete orders
  await OrderRepository.remove(orders);

  return {
    success: true,
    deletedCount: orders.length,
  };
};

export const SuperAdminBulkAccept = async (orderIds: string[], adminEmail: string) => {
  const orders = await OrderRepository.find({
    where: { id: In(orderIds) },
    relations: ["user"],
  });

  if (orders.length === 0) throw new NotFoundError("No orders found");
  if (orders.length !== orderIds.length) {
    throw new NotFoundError(`Some orders not found. Found ${orders.length} of ${orderIds.length}`);
  }

  return await OrderRepository.manager.transaction(async (transactionalEntityManager) => {
    const results = [];

    for (const order of orders) {
      const product = order.products?.[0];
      if (!product) {
        results.push({ orderId: order.id, status: "failed", reason: "No product found" });
        continue;
      }

      const publisherId = product.publisherId;
      const adjustedPrice = Number(product.adjustedPrice);

      if (!publisherId) {
        results.push({ orderId: order.id, status: "failed", reason: "Publisher ID not found" });
        continue;
      }

      if (isNaN(adjustedPrice)) {
        results.push({ orderId: order.id, status: "failed", reason: "Invalid adjusted price" });
        continue;
      }

      try {
        // Update order status
        order.orderStatus = Status.orderStatus.APPROVED;
        order.handeledBy = adminEmail;
        await transactionalEntityManager.save(order);

        // Update publisher balance
        const publisher = await transactionalEntityManager.findOne(User, {
          where: { id: publisherId },
        });

        if (!publisher) {
          results.push({ orderId: order.id, status: "failed", reason: "Publisher not found" });
          continue;
        }

        const currentBalance = parseFloat(publisher.walletBalance as any) || 0;
        const updatedBalance = Math.round(currentBalance + adjustedPrice);
        await transactionalEntityManager.update(User, publisher.id, { walletBalance: updatedBalance });

        // Send email notification
        if (order.backupEmail) {
          await sendOrderStatusNotification(order.orderNumber, Status.orderStatus.APPROVED, order.backupEmail, {});
        }

        results.push({ orderId: order.id, status: "success" });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        results.push({ orderId: order.id, status: "failed", reason: errorMessage });
      }
    }

    return results;
  });
};

export const SuperAdminBulkReject = async (orderIds: string[], rejectionReason: string, adminEmail: string) => {
  const orders = await OrderRepository.find({
    where: { id: In(orderIds) },
    relations: ["user"],
  });

  if (orders.length === 0) throw new NotFoundError("No orders found");
  if (orders.length !== orderIds.length) {
    throw new NotFoundError(`Some orders not found. Found ${orders.length} of ${orderIds.length}`);
  }

  if (!rejectionReason?.trim()) {
    throw new Error("Rejection reason is required");
  }

  return await OrderRepository.manager.transaction(async (transactionalEntityManager) => {
    const results = [];

    for (const order of orders) {
      try {
        // Update order status
        order.orderStatus = Status.orderStatus.REJECTED;
        order.handeledBy = adminEmail;
        order.rejectionReason = rejectionReason;
        await transactionalEntityManager.save(order);

        // Send email notification
        if (order.backupEmail) {
          await sendOrderStatusNotification(order.orderNumber, Status.orderStatus.REJECTED, order.backupEmail, {
            rejectionReason,
          });
        }

        results.push({ orderId: order.id, status: "success" });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        results.push({ orderId: order.id, status: "failed", reason: errorMessage });
      }
    }

    return results;
  });
};

export const updateOrderPaymentStatus = async (orderId: string, status: string) => {
  // Validate the status is 'paid' (or whatever your allowed values are)

  // Find the order
  const order = await OrderRepository.findOne({
    where: { id: orderId },
  });

  if (!order) {
    throw new NotFoundError("Order not found");
  }

  // Update the payment status
  order.payment_status = status;
  order.updatedAt = new Date();

  // Save the updated order
  await OrderRepository.save(order);
  const allPub = await getAllAdmins(Others.role.PUBLISHER);
  // send email to admins
  await sendAdminEmailForPendingOrder(
    {
      admins: allPub,
      subject: `New Pending Order #${order.orderNumber}`,
      text: `Order #${order.orderNumber} from user is pending processing.`,
    },
    Others.role.PUBLISHER
  );
  return order;
};

export const getAllPublishersOfOrder = async (orderId: string) => {
  const order = await OrderRepository.findOne({ where: { id: orderId } });
  if (!order) {
    throw new Error("Order not found");
  }
  // 2. Get all unique publisherIds from products
  const publisherIds = order.products
    .map((product) => product.publisherId)
    .filter((publisherId): publisherId is string => !!publisherId); // Remove null/undefined

  if (publisherIds.length === 0) {
    return []; // No publishers found
  }

  // 3. Find users by these IDs and return their emails
  const publishers = await UserRepository.find({
    where: { id: In(publisherIds) },
    select: ["email"],
  });

  return publishers;
}; 