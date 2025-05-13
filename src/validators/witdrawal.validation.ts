
import { z } from "zod";

export const withdrawalSchema = z.object({
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be greater than zero"),
  currency: z
    .string({ required_error: "Currency is required" })
    .min(1, "Currency is required"),
  walletAddress: z
    .string({ required_error: "Wallet address is required" })
    .min(1, "Wallet address is required"),
});

// Invoice Validator
export const invoiceSchema = z.object({
    amount: z
      .number({ invalid_type_error: "Amount must be a number" })
      .positive("Amount must be greater than zero"),
    invoiceNumber: z
      .string({ required_error: "Invoice number is required" })
      .optional(),
    walletAddress: z
      .string({ required_error: "Wallet address is required" })
      .optional(),
    currency: z
      .string({ required_error: "Currency is required" }),
    InvoiceStatus: z
      .enum(["pending", "pending", "rejected"], {
        required_error: "Invoice status is required",
      })
      .optional(),
    rejectionReason: z.string().optional(),
  });
  
  export type WithdrawalInput = z.infer<typeof withdrawalSchema>;
  export type InvoiceInput = z.infer<typeof invoiceSchema>;