 import { Request, Response } from "express";
import  { createCart,   deleteCartById,   findAllCarts, findCartsByUserId, findUsersWithNonEmptyCarts, removeProductFromCart } from "../services/cart.service";
import { asyncWrapper } from "../utils/wrapperFunctionTryCatch";
import {   CartQuerySchema } from "../validators/card.valdation";
import { AuthenticatedRequest } from "../middlewares/verifyid";
import { ProductIdSchema } from "../validators/card.validation";
 
export const create = asyncWrapper(async (req: Request, res: Response) => {
  const { userId, products } = req.body;

  if (!userId) {
    return res.status(401).json({ message: " Token expire Invlaid" });
  }

  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ message: "Invalid request payload" });
  }

  const productIds = products.map((p) => p.productId);
  const cart = await createCart(userId, productIds);

  if (!cart) {
    return res.status(404).json({ message: "Cart not found or failed to create" });
  }

 
  const message = cart.products.length > 0 ? "Products added to existing cart" : "New cart created";

  res.status(200).json({
    message,
    data: cart,
  });
});

export const getCartsByUserId = asyncWrapper(async (req: Request, res: Response) => {
  const { userId } = req.params;  

  const carts = await findCartsByUserId(userId);

  res.status(200).json({
    message: "Carts successfully retrieved",
    data: carts,
  });
});

const findAll = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  const validatedQuery = CartQuerySchema.parse(req.query);
  const response = await findAllCarts(validatedQuery);

  res.status(200).json({
    total: response.total,
    items: response.items,
    page: validatedQuery.page,
    limit: validatedQuery.limit,
  });
});

export const remove = asyncWrapper(async (req: Request, res: Response) => {
 
  const { id: productId } = ProductIdSchema.parse(req.params);
  const userId = req.user.id;
 
  const updatedCart = await removeProductFromCart(userId, productId);

  res.status(200).json({
    message: "Product successfully removed from cart",
    data: updatedCart,
  });
});

export const deletedCartById = asyncWrapper(async (req: Request, res: Response) => {
  const { id: cartId } = req.params;
   const userId = req.user.id;
  const result = await deleteCartById(userId,cartId);

  res.status(200).json(result);
});


export const getUsersWithCart = asyncWrapper(async (req, res) => {
  const usersWithCart = await findUsersWithNonEmptyCarts();
})
export default { create, findAll, getCartsByUserId , remove,deletedCartById };
