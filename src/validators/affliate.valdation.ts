import { z } from "zod";

export const affiliateRequestSchema = z.object({
  userId: z.string().uuid(), 
});

export type AffiliateInput = z.infer<typeof affiliateRequestSchema>;


