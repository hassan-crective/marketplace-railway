import { z } from "zod";
import { Status } from "../enums/status.enum";
export const OrderInvocieValidationSchemaQuery = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("10"),
  sort: z.string().optional(),
  order: z.enum(["ASC", "DESC"]).optional(),
  q: z.string().optional(),
  orderStatus : z.nativeEnum(Status.orderStatus).optional(),
});
