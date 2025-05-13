import { In, IsNull, Not } from "typeorm";
import { NotFoundError } from "../errors/notFound.error";
import { CartRepository, ProductRepository, UserRepository } from "../repositories";
import { getSortPaging } from "../utils/sortPagination";

export const createCart = async (userId: string, productIds: string[]) => {
  const user = await UserRepository.findOne({ where: { id: userId } });
  if (!user) throw new NotFoundError("User not found");

  let cart = await CartRepository.findOne({
    where: { user: { id: userId } },
    relations: ["products"],
  });

  const products = await ProductRepository.findBy({ id: In(productIds) });
  const approvedProducts = products.filter((p) => p.isProductApprove);

  if (approvedProducts.length === 0) {
    throw new NotFoundError(" Product is not approved  therefore you can no the product to add to the cart");
  }

  if (cart) {
    const existingProductIds = new Set(cart.products.map((p) => p.id));
    const newProducts = approvedProducts.filter((p) => !existingProductIds.has(p.id));

    if (newProducts.length === 0) {
      throw new NotFoundError("Products are already in the cart");
    }

    cart.products.push(...newProducts);
    cart.totalAmount = Math.floor(cart.products.reduce((sum, p) => sum + Number(p.adjustedPrice || 0), 0));

    await CartRepository.save(cart);
  } else {
    const totalAmount = Math.floor(approvedProducts.reduce((sum, p) => sum + Number(p.adjustedPrice || 0), 0));

    cart = CartRepository.create({
      user,
      products: approvedProducts,
      totalAmount,
    });

    await CartRepository.save(cart);
  }

  return cart;
};
export const findCartsByUserId = async (userId: string) => {
  const carts = await CartRepository.find({
    where: { user: { id: userId } },
    relations: ["user", "products"],
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      totalAmount: true,
      user: { id: true },
      products: {
        id: true,
        siteName: true,
        price: true,
        adjustedPrice: true,
        category: true,
        monthlyTraffic: true,
        linkType: true,
        country: true,
        websiteUrl: true,
      },
    },
  });

  if (!carts.length) {
    throw new NotFoundError("No carts found for this user.");
  }

  return carts;
};

export const findAllCarts = async (query: any) => {
  const { sort, skip, limit } = getSortPaging(query);

  const [items, total] = await CartRepository.findAndCount({
    relations: ["user", "products"],
    order: sort,
    skip,
    take: limit,
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      totalAmount: true,
      user: {
        id: true,
      },
      products: {
        id: true,
        siteName: true,
        price: true,
        adjustedPrice: true,
        category: true,
        productStatus: true,
        monthlyTraffic: true,
        linkType: true,
        country: true,
        websiteUrl: true,
      },
    },
  });

  return {
    total,
    items,
    page: query.page,
    limit: query.limit,
  };
};

export const removeProductFromCart = async (userId: string, productId: string) => {
  const cart = await CartRepository.findOne({
    where: { user: { id: userId } },
    relations: ["products"],
  });

  if (!cart) {
    throw new NotFoundError("Cart not found");
  }

  const productIndex = cart.products.findIndex((product) => product.id === productId);
  if (productIndex === -1) {
    throw new NotFoundError("Product remove  from the cart");
  }

  cart.products.splice(productIndex, 1);

  if (cart.products.length === 0) {
    await CartRepository.remove(cart);
    return { message: "Cart deleted because it had no more products" };
  }

  cart.totalAmount = cart.products.reduce((sum, product) => sum + Number(product.adjustedPrice), 0);

  await CartRepository.save(cart);
  return cart;
};

export const deleteCartById = async (userId: string, id: string) => {
  const cart = await CartRepository.findOne({
    where: { id },
    relations: ["products"],
  });
  console.log;
  if (!cart) {
    throw new NotFoundError("Cart not found");
  }

  await CartRepository.remove(cart);

  return { message: "Cart deleted successfully" };
};

export const findUsersWithNonEmptyCarts = async () => {
  return await CartRepository.find({
    relations: ["user", "products"],
    where: {
      products: {
        id: Not(IsNull()),
      },
    },
    select: {
      id: true,
      totalAmount: true,
      user: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
      products: {
        id: true,
        siteName: true,
        price: true,
        adjustedPrice: true,
        category: true,
        monthlyTraffic: true,
        linkType: true,
        country: true,
        websiteUrl: true,
      },
    },
  });
};

export default { createCart, findCartsByUserId, removeProductFromCart, deleteCartById, findUsersWithNonEmptyCarts };
