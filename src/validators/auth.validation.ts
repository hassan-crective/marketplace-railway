import { z } from "zod";

export const AuthInputSchema = z.object({
  firstName: z.string().min(2, { message: "First name should be at least 2 characters long" }),
  lastName: z.string().min(2, { message: "Last name should be at least 2 characters long" }),
  email: z
    .string()
    .email({ message: "Invalid email format" }),
  password: z
    .string()
    .min(8, { message: "Password should be at least 8 characters long" })
    .regex(/(?=.*[A-Z])(?=.*[@$!%*?&])/, {
      message: "Password must contain at least 1 uppercase letter and 1 special character",
    }),
  country: z.string().min(2, { message: "Country name should be at least 2 characters long" }),
  phoneNumber: z.string().min(10, { message: "Phone number should be at least 10 characters long" }),
  numberOfSites: z.number().nonnegative({ message: "Number of sites must be a non-negative number" }),
  ownsSite: z.boolean({ required_error: "Owns site field is required" }),
  hasDoFollowLinks: z.boolean({ required_error: "Has DoFollow links field is required" }),
  sellingArticles: z.boolean({ required_error: "Selling articles field is required" }),
  businessName: z.string().optional(), // Optional field
  businessType:z.string().optional(),
  currency: z.string().min(1, { message: "Currency is required" }),
  walletAddress: z.string().optional(), // Optional field
  referedBy: z.string().optional(),
  sellingArticlesURL: z.string().url({ message: "Invalid URL format" }).optional(), // Optional field
});

export const UserAuthInputSchema = z.object({
  firstName: z.string().min(2, { message: "First name should be at least 2 characters long" }),
  lastName: z.string().min(2, { message: "Last name should be at least 2 characters long" }),
  email: z
    .string()
    .email({ message: "Invalid email format" }),
  password: z
    .string()
    .min(8, { message: "Password should be at least 8 characters long" })
    .regex(/(?=.*[A-Z])(?=.*[@$!%*?&])/, {
      message: "Password must contain at least 1 uppercase letter and 1 special character",
    }),
  country: z.string().min(2, { message: "Country name should be at least 2 characters long" }).optional(),
  phoneNumber: z.string().min(10, { message: "Phone number should be at least 10 characters long" }).optional(),
  businessType:z.string().optional(),
  businessName: z.string().optional(), // Optional field
  currency: z.string().min(1, { message: "Currency is required" }),
  walletAddress: z.string().optional(), // Optional field
  referedBy: z.string().optional(),
  sellingArticlesURL: z.string().url({ message: "Invalid URL format" }).optional(), // Optional field
  monthlyBudget:z.number().nonnegative({ message: "monthly budget cannot be negative" }).optional(),
});

export const LoginInputSchema = z.object({
  email: z
    .string()
    .email(),
  password: z.string().min(8, { message: "Password should be at least 8 characters long with 1 uppercaseletter and 1 special letter" }),
})

export const VerifyOTPSchema = z.object({
  email: z.string().email(),
  otp: z.string(),
});

export const refreshAccessTokenSchema = z.object({
  refreshToken: z.string(),
});

export const AuthUpdateInputSchema = z.object({
  firstName: z.string().min(2, { message: "First name should be at least 2 characters long" }).optional(),
  lastName: z.string().min(2, { message: "Last name should be at least 2 characters long" }).optional(),
  email: z
    .string()
    .email({ message: "Invalid email format" }),
 
  country: z.string().min(2, { message: "Country name should be at least 2 characters long" }).optional(),
  
});

export const PasswordInputSchema = z.object({
  password: z
  .string()
  .min(8, { message: "Password should be at least 8 characters long" })
  .regex(/(?=.*[A-Z])(?=.*[@$!%*?&])/, {
    message: "Password must contain at least 1 uppercase letter and 1 special character",
  }),
})

export const updateWalletValidator =z.object({
  walletAddress: z.string().min(1, { message:"Wallet address is required"}),
  currency: z.string().min(1, { message: "Currency is required" }),
})

export type AuthInput = z.infer<typeof AuthInputSchema>;
export type UserAuthInput = z.infer<typeof UserAuthInputSchema>;
export type VerifyOTPInput = z.infer<typeof VerifyOTPSchema>;
export type RefreshAccessTokenInput = z.infer<typeof refreshAccessTokenSchema>;
export type UpdateInput = z.infer<typeof AuthUpdateInputSchema>;
export type PasswordInput = z.infer<typeof PasswordInputSchema>;
