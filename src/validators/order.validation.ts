import { z } from "zod";
import { Others } from "../enums/others.enum";

const OrderProductSchema = z.object({
  productId: z.string().uuid(),

});

 
export const CreateUserOrderSchema = z.object({
  notes: z.string().optional(),
  file: z.string().optional(),
  backupEmail: z.string().email().optional(),
  products: z.array(OrderProductSchema),
  network: z.string(),
  to_currency: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  postalCode: z.string(),
  city: z.string(),
  country: z.string(),
  phoneNo: z.string(),
  anchorLink: z.string().optional(),
  anchor: z.string().optional(),
  transactionId: z.string().optional(),
  paymentType: z.enum(["Payoneer", "Cryptomus"]),
});

 
export const RequestOrderToPublisherSchema = CreateUserOrderSchema.extend({
  anchorLink: z.string().optional(),
  anchor: z.string().optional(),
  wordLimit: z.nativeEnum(Others.wordLimit).optional(),
  backupEmail: z.string().email().optional(),
  notes: z.string().optional(),
  network: z.string(),
  to_currency: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  postalCode: z.string(),
  city: z.string(),
  country: z.string(),
  phoneNo: z.string(),
  paymentType: z.enum(["Payoneer", "Cryptomus"]),
});

export const OrderIdSchema = z.object({
  id: z.string().uuid(),
});

export const OrderValidationSchemaQuery = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("10"),
  sort: z.string().optional(),
  order: z.enum(["ASC", "DESC"]).optional(),
  contentProvidedBy: z.string().optional(),
  orderStatus: z.string().optional(),
  q: z.string().optional(),
  orderNumber: z.coerce.number().optional()  // This converts string to number automatically
});

export const UpdateUserProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  phoneNo:  z.string().optional(),
});

export const BulkOrderIdSchema = z.object({
  orderIds: z.array(
    z.string().uuid({ message: "Invalid UUID format" })
  ).min(1, "At least one order ID is required"),
});

  export type orderUserInput = z.infer<typeof  CreateUserOrderSchema>;
  export type orderRequestInput = z.infer<typeof  RequestOrderToPublisherSchema>;
  export type orderInputId = z.infer<typeof  OrderIdSchema>;
  export type orderQuery = z.infer<typeof  OrderValidationSchemaQuery>;
  export type updateProfileQuery = z.infer<typeof  UpdateUserProfileSchema>;
