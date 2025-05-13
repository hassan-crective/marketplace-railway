import { NextFunction, Request, Response } from "express";
import { BadRequestError } from "../errors/badRequest.error";
import { ProductRepository, UserRepository } from "../repositories";
import { productSchema, ProductValidationSchemaQuery, updateFieldsSchema } from "../validators/product.validation";
import productService, { deleteProduct, getAllProductsUser, updatePublisherProductService } from "../services/product.service";
import { submitPostSchema, SubmitPostInput } from "../validators/product.validation";
import { NotFoundError } from "../errors/notFound.error";
import { UnauthorizedError } from "../errors/unauthorizedError";
import { getSortPaging } from "../utils/sortPagination";
import { Status } from "../enums/status.enum";
import { approveEditRequest, getUpdateRequests } from "../services/admin.services";
import { asyncWrapper } from "../utils/wrapperFunctionTryCatch";


// Creating a product
const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.userId;
    const user = await UserRepository.findOne({ where: { id: userId } });

    let productData = productSchema.parse(req.body);

    if (typeof productData.category === "string") {
      productData.category = productData.category.split(",").map((c) => c.trim());
    }

    const product = await productService.createProduct(userId, productData);

    res.status(200).json({
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error in createProduct", { error }, "ProductController");
    next(error);
  }
};

// Get all products
export const getProducts = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      throw new UnauthorizedError("Unauthorized access");
    }

    const userId = req.user.userId;
    console.log("Fetching products for user:", userId);

    // Ensure default sorting is applied if not specified in query
    const sort = req.query.sort || { createdAt: "DESC" }; // Default: newest first
    const products = await productService.getProducts(userId, { ...req.query, sort }); 

    if (!products || products.length === 0) {
      throw new BadRequestError("No products found for this user");
    }

    const total = await ProductRepository.count({ where: { user: { id: userId } } });

    res.status(200).json({
      message: "Products retrieved successfully",
      products,
      pagination: {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);

    if (error instanceof UnauthorizedError) {
      return res.status(401).json({ error: error.message });
    }

    if (error instanceof BadRequestError) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: "Internal server error" });
  }
};

// Update product
const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    const userId = req.user.userId;
    const productId = req.params.id;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "No data provided for update" });
    }

    const validatedData = updateFieldsSchema.parse(req.body);

    if (validatedData.category) {
      validatedData.category = Array.isArray(validatedData.category) 
        ? validatedData.category 
        : validatedData.category.split(",").map((c) => c.trim()).filter(Boolean);
    }

    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([key, value]) => key !== "category" && value !== null)
    );

    if (validatedData.category !== undefined) {
      updateData.category = validatedData.category;
    }

    const updatedProduct = await productService.updateProduct(userId, productId, updateData);

    res.status(200).json({
      message: "Product update submitted for admin approval",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    if (error instanceof BadRequestError) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

// Delete product
const deleteProducts = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.userId;
    const { productId } = req.params;

    console.log("Authenticated User ID:", userId);
    console.log("Product ID from request:", productId);

    const response = await deleteProduct(userId, productId);

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error deleting product:", error);

    if (error instanceof BadRequestError) {
      return res.status(400).json({ message: error.message });
    } else if (error instanceof NotFoundError) {
      return res.status(404).json({ message: error.message });
    }

    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Submit a submittedPostUrl
export const submitPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const productId = req.params.id;

    const validationResult = submitPostSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ message: validationResult.error.errors[0].message });
    }

    const { submittedPostUrl }: SubmitPostInput = validationResult.data;
    const updatedProduct = await productService.submitPost(userId, productId, submittedPostUrl);

    res.status(200).json({
      message: "Post submitted successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error in submitPost controller", { error }, "ProductController");
    next(error);
  }
};

// Get pending products
const getPendingProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId= req.user.userId;  
    console.log("userId:", userId);
    const { sort, skip, limit } = getSortPaging(req.query);  
    const pendingProducts = await productService.getPendingProducts(userId, { sort, skip, limit });


    const total = await ProductRepository.count({
      where: {
        user: { id: userId },
        poststatus: Status.postStatus.PENDING,  
      },
    });

    if (!pendingProducts || pendingProducts.length === 0) {
      throw new BadRequestError("No pending products found");
    }

    return res.status(200).json({
      message: "Pending products fetched successfully",
      products: pendingProducts,
      pagination: {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 100,
        total,
      },
    });
  } catch (error) {
    console.error("Error in getPendingProducts controller", { error }, "ProductController");
    next(error);  // Pass the error to the next middleware
  }
};

// Get unapproved products
const getUnapprovedProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id; 
    const { sort, skip, limit } = getSortPaging(req.query);  

    const unapprovedProducts = await productService.getUnapprovedProducts(userId, { sort, skip, limit });
    const total = await ProductRepository.count({
      where: {
        user: { id: userId },
        isProductApprove: false, 
      },
    });
    if (!unapprovedProducts || unapprovedProducts.length === 0) {
      throw new BadRequestError("No unapproved products found");
    }
   return res.status(200).json({
      message: "Unapproved products fetched successfully",
      products: unapprovedProducts,
      pagination: {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        total,
      },
    });
  } catch (error) {
    console.error("Error in getUnapprovedProducts controller", { error }, "ProductController");
    next(error);
  }
};

// get by user product
export const getAllProductsUsers = asyncWrapper(async (req: any, res: Response) => {
  try {
    const validatedQuery = ProductValidationSchemaQuery.parse(req.query);
    const response = await getAllProductsUser(validatedQuery);
    return res.status(200).json({
      total: response.total,
      items: response.items,
      page: validatedQuery.page,
      limit: validatedQuery.limit,
    });
  } catch (error) {
    console.error("Error Fetching Products:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

export const updatePublisherProductController = async (req: Request, res: Response) => {
  try {
    const adminId = req.user.id; // Assuming `req.user` contains authenticated admin info
    const { productId } = req.params;
    const updateData = req.body;

    if (!productId || !updateData) {
      return res.status(400).json({ message: "Product ID and update data are required" });
    }

    const updatedProduct = await updatePublisherProductService(adminId, productId, updateData);

    return res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error in updatePublisherProductController:", error);
  
  }
};

export default {
  createProduct,
  getProducts,
  updateProduct,
  deleteProducts,
  submitPost,
  getPendingProducts,
  getUnapprovedProducts,
  getAllProductsUsers
};


