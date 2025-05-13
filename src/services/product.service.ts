import { ProductRepository } from "../repositories";
import { Product } from "../models/product";
import { UserRepository } from "../repositories";
import { BadRequestError } from "../errors/badRequest.error";
import { ProductInput } from "../validators/product.validation";
import { Others } from "../enums/others.enum";
import { Status } from "../enums/status.enum";
import {  Between, Equal, ILike, Raw } from "typeorm";
import { NotFoundError } from "../errors/notFound.error";
import { getSortPaging,  } from "../utils/sortPagination";
import { sendEmail } from "../utils/emails";


// create product 
async function createProduct(userId: string, productData: ProductInput) {
  try {
    if (!productData) {
      throw new BadRequestError("Product data is undefined or invalid.");
    }

    const { websiteUrl, siteType, siteName, newPostPrice, linkInsertionPrice, category } = productData;
    if (!websiteUrl || !siteType) {
      throw new BadRequestError("Website URL and Site Type are required.");
    }

    // ✅ Ensure category is always an array
    const categoryArray = Array.isArray(category) ? category : category ? category.split(",").map((c) => c.trim()) : [];

    const user = await UserRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestError("User not found");
    }

    const siteTypes = siteType.split(",").map((type) => type.trim());
    const createdProducts = [];

    for (const type of siteTypes) {
      const existingProduct = await ProductRepository.findOne({
        where: { websiteUrl: websiteUrl, siteType: type as Others.siteType },
      });

      if (existingProduct) {
        console.warn(`Product with Website URL "${websiteUrl}" and Site Type "${type}" already exists.`);
        continue;
      }

      const product = new Product();
      Object.assign(product, productData);
      product.category = categoryArray; // ✅ Category is now always an array
      product.siteType = type as Others.siteType;
      product.user = user;
      product.postingLink = `${websiteUrl}/post-${userId}-${Date.now()}`;

      if (type === "newPost") {
        if (!newPostPrice) {
          throw new BadRequestError("New Post Price is required for site type 'newPost'.");
        }
        product.price = newPostPrice;
      } else if (type === "linkInsertion") {
        if (!linkInsertionPrice) {
          throw new BadRequestError("Link Insertion Price is required for site type 'linkInsertion'.");
        }
        product.price = linkInsertionPrice;
      } else {
        throw new BadRequestError(`Invalid Site Type: ${type}`);
      }

      product.adjustedPrice = product.price * 1.25;

      const savedProduct = await ProductRepository.save(product);
      createdProducts.push(savedProduct);

      await sendEmail({
        toEmail: user.email,
        subject: "Product Created Successfully",
        text: `Your product ${product.siteName} has been created successfully and is pending review.`,
      });
    }

    if (createdProducts.length === 0) {
      throw new BadRequestError("No products were created. They may already exist.");
    }

    return createdProducts;
  } catch (error) {
    console.error("Error in createProduct service", { error, productData }, "ProductService");
    throw error;
  }
}

// Service to create a product
async function getProducts(userId: string, query: any): Promise<Product[]> {
  try {
    const { page = 1, limit = 10, sort, filters } = query;
    const skip = (page - 1) * limit;

    const whereConditions = {
      user: { id: userId },
      ...filters,
    };

    // Default sorting by createdAt DESC (newest first)
    const order = sort || { createdAt: "DESC" }; // Fallback to newest-first if no sort provided

    const products = await ProductRepository.find({
      where: whereConditions,
      relations: ["user"],
      select: {
        user: {
          id: true,
        },
      },
      skip,
      take: limit,
      order, // Apply sorting
    });

    return products;
  } catch (error) {
    console.error("Error in getProductsByUser service", { error }, "ProductService");
    throw error;
  }
}

// Service to update a product
const updateProduct = async (userId: string, productId: string, updateData: Partial<Product["updateFields"]>) => {
  try {
    const product = await ProductRepository.findOne({
      where: {
        id: productId,
        user: { id: userId },
      },
      relations: ["user"],
    });

    if (!product) {
      throw new BadRequestError("Product not found or you do not have permission to edit this product");
    }
    product.updateFields = { ...product.updateFields, ...updateData };
    product.isProductApprove = false;

    const updatedProduct = await ProductRepository.save(product);

    await sendEmail({
      toEmail: product.user.email,
      subject: "Product Updated",
      text: `Your product has been updated successfully! 🎉`,
    });
    return updatedProduct;
  } catch (error) {
    throw error;
  }
};

// Service to delete a product
export async function deleteProduct(userId: string, productId: string) {
  console.log("Finding product with ID:", productId);
  const product = await ProductRepository.findOne({ where: { id: productId }, relations: ["user"] });

  if (!product) {
    throw new NotFoundError("Product not found");
  }

  console.log("Product found:", product);

  if (product.user.id !== userId) {
    throw new BadRequestError("You are not authorized to delete this product");
  }

  console.log("Deleting product...");
  await ProductRepository.delete(productId);
  console.log("Product deleted successfully");

  return { message: "Product deleted successfully" };
}

// Service to submit a post
const submitPost = async (userId: string, productId: string, submittedPostUrl: string) => {
  try {
    const product = await ProductRepository.findOne({
      where: { id: productId, user: { id: userId } },
      relations: ["user"],
    });

    if (!product) {
      throw new BadRequestError("Product not found or you do not have permission to submit this post");
    }
    product.submittedPostUrl = submittedPostUrl;
    product.poststatus = Status.postStatus.SUBMITTED;
    const updatedProduct = await ProductRepository.save(product);
    await sendEmail({
      toEmail: product.user.email,
      subject: "Posting Link Submitted Successfully",
      text: `Your posting link has been received! ✅`,
    });
    return updatedProduct;
  } catch (error) {
    console.error("Error in submitPost service", { error }, "ProductService");
    throw error;
  }
};

// Service to getPostPendingProducts
const getPendingProducts = async (userId: string, { sort, skip, limit }: { sort: Record<string, "ASC" | "DESC">; skip: number; limit: number }) => {
  try {
    const pendingProducts = await ProductRepository.find({
      where: {
        user: { id: userId },
        poststatus: Status.postStatus.PENDING, 
      },
      skip,
      take: limit, 
      order: sort,  
    });

    return pendingProducts;
  } catch (error) {
    console.error("Error in getPendingProducts service", { error }, "ProductService");
    throw error;
  }
};

 
const getUnapprovedProducts = async (userId: string, { sort, skip, limit }: { sort: Record<string, "ASC" | "DESC">; skip: number; limit: number }) => {
  try {
    const unapprovedProducts = await ProductRepository.find({
      where: {
        user: { id: userId },
        isProductApprove: false,  
      },
      skip,  
      take: limit,  
      order: sort,
    });

    return unapprovedProducts;
  } catch (error) {
    console.error("Error in getUnapprovedProducts service", { error }, "ProductService");
    throw error;
  }
};

export const getAllProductsUser = async (query: any) => {
  const queryObject: any = {
    isProductApprove: true,
  };

  // Add filters based on query parameters
  if (query.currency) queryObject.currency = query.currency;
  if (query.productStatus) queryObject.productStatus = query.productStatus;
  if (query.niche) queryObject.niche = query.niche;
  if (query.country) queryObject.country = query.country;

  if (query.category) {
    const categories = Array.isArray(query.category) ? query.category : [query.category];
    queryObject.category = Raw(alias => `${alias} && ARRAY[:...categories]`, { categories });
  }

  // Handle range filters (e.g., price, DA, DR)
  const handleRangeFilter = (field: string, min?: number, max?: number) => {
    if (min || max) {
      queryObject[field] = Between(min ?? 0, max ?? Number.MAX_SAFE_INTEGER);
    }
  };
  handleRangeFilter("adjustedPrice", query.minPrice, query.maxPrice);
  handleRangeFilter("domainAuthority", query.minDA, query.maxDA);
  handleRangeFilter("domainRatings", query.minDR, query.maxDR);
  handleRangeFilter("monthlyTraffic", query.minMonthlyTraffic, query.maxMonthlyTraffic);

  // Add search query if provided
  if (query.q) {
    const searchTerm = `%${query.q.toLowerCase()}%`;
    queryObject.siteName = ILike(searchTerm);
  }

  // Sorting Logic
  const sortOptions: Record<string, any> = {
    newest: { createdAt: "DESC" },
    "price-low-to-high": { adjustedPrice: "ASC" },
    "price-high-to-low": { adjustedPrice: "DESC" },
    "da-low-to-high": { domainAuthority: "ASC" },
    "da-high-to-low": { domainAuthority: "DESC" },
    "dr-low-to-high": { domainRatings: "ASC" },
    "dr-high-to-low": { domainRatings: "DESC" },
    "monthly-traffic-high-to-low": { monthlyTraffic: "DESC" },
  };

  const sort = sortOptions[query.sort] || { createdAt: "DESC" }; // Default to 'Newest'

  const page = query.page ? Math.max(1, parseInt(query.page as string)) : 1;
  const limit = query.limit ? parseInt(query.limit as string) : 10;
  const skip = (page - 1) * limit;

  // Fetch products
  const [items, total] = await ProductRepository.findAndCount({
    where: queryObject,
    order: sort,
    skip,
    take: limit,
  });

  return {
    total,
    items,
    page: query.page || 1,
    limit,
  };
};

export const updatePublisherProductService = async (
  adminId: string, // To log which admin performed the action
  productId: string,
  updateData: Partial<Product>
) => {
  try {
    // Fetch the product
    const product = await ProductRepository.findOne({ where: { id: productId } });

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    // Prevent updates to certain fields
    const restrictedFields = ["id", "createdAt", "updatedAt", "user", "isProductApprove"];
    restrictedFields.forEach((field) => {
      if (field in updateData) {
        delete updateData[field as keyof Partial<Product>];
      }
    });

    // Additional validation: Check if product has a rejection reason
    if (product.rejectionReason) {
      throw new BadRequestError(
        "Product cannot be updated because it has been rejected. Please contact support."
      );
    }

    // Apply updates
    Object.assign(product, updateData);

    // Save the updated product
    const updatedProduct = await ProductRepository.save(product);

    console.log(`Admin ${adminId} updated product ${productId} successfully.`);
    return updatedProduct;
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

export default { createProduct, getProducts, updateProduct, deleteProduct , submitPost , getPendingProducts , getUnapprovedProducts , getAllProductsUser } ;
