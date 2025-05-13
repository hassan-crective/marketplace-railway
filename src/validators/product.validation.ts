
import { z } from "zod";

// Product validation schema based on the Product model
export const productSchema = z.object({
  siteName: z.string().min(1, "Site name is required."),
  websiteUrl: z.string().url("Website URL must be a valid URL.").nullable(),
  sampleLink: z.string().url("Sample link must be a valid URL.").nullable(),
  price: z.number().positive("Price must be a positive number.").optional().nullable(),
  adjustedPrice: z.number().positive("Adjusted price must be a positive number.").optional().nullable(),
  language: z.string().min(1, "Language is required.").nullable(),
  niche: z.string().min(1, "Niche is required.").nullable(),
  country: z.string().min(1, "Country is required.").nullable(),
  currency: z.string().min(1, "Currency is required.").nullable(),
  category: z.union([
    z.string().min(1, "Category is required."),
    z.array(z.string().min(1, "Each category must be a non-empty string.")),
  ]),
  postingLink: z.string().url("Posting link must be a valid URL.").optional().nullable(),
  poststatus: z.enum(["pending", "submitted"]).optional(), // Adjust enums as per Status.postStatus
  submittedPostUrl: z.string().url("Submitted post URL must be a valid URL.").optional().nullable(),
  linkType: z.enum(["doFollow", "noFollow"]).nullable(), // Adjust enums as per Others.linkType
  maxLinkAllowed: z.string().nullable(),
  Wordlimit: z.string().nullable(),
  monthlyTraffic: z.number().nonnegative().optional().nullable(),
  domainRatings: z.number().nonnegative().optional().nullable(),
  domainAuthority: z.number().min(0).max(100, "Domain authority must be between 0 and 100.").optional().nullable(),
  addedby: z.number().optional().nullable(),
  turnAroundTime: z.string().nullable(),
  liveTime: z.string().nullable(),
  siteType: z.string().nullable(),
  isProductApprove: z.boolean().default(false),
  rejectionReason: z.string().optional().nullable(),
  newPostPrice: z.number().optional().nullable(),
  linkInsertionPrice:z.number().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  
});


export const updateFieldsSchema = z.object({
  siteName: z.string().optional(),
      price: z.number().optional(),
      adjustedPrice: z.number().optional(),
      domainAuthority: z.number().optional(),
     category: z.union([ z.string(), z.array(z.string()),]).optional().nullable(),
      niche: z.string().optional(),
      domainRatings: z.number().optional(),
      monthlyTraffic: z.number().optional(),
      turnAroundTime: z.string().optional(),
      language: z.string().optional(),
});

export const submitPostSchema = z.object({
  submittedPostUrl: z
    .string()
    .url("Submitted Post URL must be a valid URL")
    .nonempty("Submitted Post URL is required"),
});



 

export const ProductValidationSchemaQuery = z.object({
  page: z.string().optional().default("1").transform(Number),
  limit: z.string().optional().default("10").transform(Number),
  sort: z.string().optional(),
  order: z.enum(["ASC", "DESC"]).optional(),
  q: z.string().optional(),

  category: z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((val) => {
    if (typeof val === 'string') {
      return val.split(',').map(c => c.trim());
    } else if (Array.isArray(val)) {
      return val;
    }
    return undefined;
  }),
  currency: z.string().optional(),
  productStatus: z.string().optional(),
  niche: z.string().optional(),

  minPrice: z.string().optional().transform((val) => (val ? Number(val) : undefined)),
  maxPrice: z.string().optional().transform((val) => (val ? Number(val) : undefined)),

  minDA: z.string().optional().transform((val) => (val ? Number(val) : undefined)),
  maxDA: z.string().optional().transform((val) => (val ? Number(val) : undefined)),

  minDR: z.string().optional().transform((val) => (val ? Number(val) : undefined)),
  maxDR: z.string().optional().transform((val) => (val ? Number(val) : undefined)),

  minMonthlyTraffic: z.string().optional().transform((val) => (val ? Number(val) : undefined)),
  maxMonthlyTraffic: z.string().optional().transform((val) => (val ? Number(val) : undefined)),
});

export const ProductApproveInputSchema = z.object({
  domainRatings: z.number().min(1, { message: "Domain Ratings must be at least 1." }),
  domainAuthority: z.number().min(1, { message: "Domain Authority must be at least 1." }),
  monthlyTraffic: z.number().min(1, { message: "Monthly Traffic must be at least 1." }),
});

export const BulkProductApproveInputSchema = z.object({
  productIds: z.array(z.string()).min(1, "At least one product ID is required"),
  monthlyTraffic: z.number().min(0),
  domainRatings: z.number().min(0).max(100),
  domainAuthority: z.number().min(0).max(100),
});

export const BulkProductRejectInputSchema = z.object({
  productIds: z.array(z.string()).min(1, "At least one product ID is required"),
  rejectionReason: z.string().min(1, "Rejection reason is required"),
});

export type SubmitPostInput = z.infer<typeof submitPostSchema>;
export type updateFieldsInput = z.infer<typeof updateFieldsSchema>;
export type ProductInput = z.infer<typeof productSchema>;
