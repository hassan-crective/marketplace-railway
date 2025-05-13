import { z } from "zod";

export const ModeratorInputSchema = z.object({
  firstName: z.string().min(2, { message: "First name must have at least 2 characters" }),
  lastName: z.string().min(2, { message: "Last name must have at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address format" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/(?=.*[A-Z])(?=.*[@$!%*?&])/, {
      message: "Password must contain at least one uppercase letter and one special character",
    }),
  permissions: z.array(z.string()),
});

export const AdminInputSchema = z.object({
  firstName: z.string().min(2, { message: "First name must have at least 2 characters" }),
  lastName: z.string().min(2, { message: "Last name must have at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address format" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/(?=.*[A-Z])(?=.*[@$!%*?&])/, {
      message: "Password must contain at least one uppercase letter and one special character",
    }),
});

export const ProductApproveInputSchema = z.object({
  domainRatings: z.number().min(1, { message: "Domain Authority must be minimum 1 digit" }),
  domainAuthority: z.number().min(1, { message: "Domain Authority must be minimum 1 digit" }),
  monthlyTraffic: z.number().min(1, { message: "Domain Authority must be minimum 1 digit" }),
});

export const ProductRejectInputSchema = z.object({
  rejectionReason: z.string().min(1, { message: "there must be a rejection reason" }),
});

export const ModeratorUpdateInputSchema = z.object({
  firstName: z.string().min(2, { message: "First name must have at least 2 characters" }).optional(),
  lastName: z.string().min(2, { message: "Last name must have at least 2 characters" }).optional(),
  email: z.string().email({ message: "Invalid email address format" }).optional(),
  permissions: z.array(z.string()),
});

export const UpdateUserDetail = z.object({
  firstName: z.string().min(2, { message: "First name must have at least 2 characters" }).optional(),
  lastName: z.string().min(2, { message: "Last name must have at least 2 characters" }).optional(),
  phoneNo: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits" })
    .max(15, { message: "Phone number must be at most 15 digits" })
    .optional(),
  currency: z.string().length(3, { message: "Currency must be a 3-letter code (e.g., USD)" }).optional(),
  country: z.string().min(2, { message: "Country name must be at least 2 characters" }).optional(),
  city: z.string().min(2, { message: "City name must be at least 2 characters" }).optional(),
  postalCode: z
    .string()
    .min(4, { message: "Postal code must be at least 4 characters" })
    .max(10, { message: "Postal code must be at most 10 characters" })
    .optional(),
  monthlyBudget: z
    .number({ invalid_type_error: "Monthly budget must be a number" })
    .min(0, { message: "Monthly budget must be 0 or greater" })
    .optional(),
});

export type UpdateUserDetail = z.infer<typeof UpdateUserDetail>;
export type ModeratorInput = z.infer<typeof ModeratorInputSchema>;
export type AdminInput = z.infer<typeof AdminInputSchema>;
export type ApproveProductInput = z.infer<typeof ProductApproveInputSchema>;
export type RejectProductInput = z.infer<typeof ProductRejectInputSchema>;
