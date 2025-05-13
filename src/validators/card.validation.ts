import { z } from "zod";


export const CartValidationSchema = z.object({
  products: z.array(
    z.object({
      productId: z.string().trim().uuid(),
    })
  ),
});


export const CartQuerySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("10"),
  sort: z.string().optional(),
  order: z.enum(["ASC", "DESC"]).optional(),
});

export const CartIdSchema = z.object({
  id: z.string().uuid(),
});

export const ProductIdSchema = z.object({
  id: z.string().uuid(),
});
export type CartInput = z.infer<typeof CartValidationSchema>;
export type CartInputId = z.infer<typeof CartIdSchema>;
export type CartQuery = z.infer<typeof CartQuerySchema>;
