
import { Request, Response } from "express";
import { affiliateRequestSchema } from "../validators/affliate.valdation";
import { getAffiliateUsers, removeAffiliateUserService, updateAffiliateStatus, UserService } from "../services/affliate.service";
import { getSortPaging } from "../utils/sortPagination";
import { UserRepository } from "../repositories";

// request affiliate
const requestAffiliate = async (req: Request, res: Response) => {
  try {
    console.log("Request User:", req.user); 

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized request!" });
    }

    affiliateRequestSchema.parse({ userId });
    const updatedUser = await UserService.requestAffiliate(userId);

    return res.status(200).json({
      message: "Affiliate request submitted successfully!",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

// admin  get affiliate info 
const fetchAffiliateUsers = async (req: Request, res: Response) => {
  try {
   

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized request!" });
    }
    affiliateRequestSchema.parse({ userId });

    const sortPaging = getSortPaging(req.query);
    const total = await UserRepository.count();
    const status = req.query.status as string || "pending"; 

   
    const users = await getAffiliateUsers(status, sortPaging);
   

    return res.status(200).json({
      message: "Affiliate users fetched successfully!",
      users,
      pagination: {
        page: parseInt(req.query.page as string, 10) || 1,
        limit: parseInt(req.query.limit as string, 10) || 10,
        total,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(400).json({ message: (error as Error).message });
  }
};

// admin approve and reject affliate request
const approveOrRejectAffiliate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; 
    const { status } = req.body; 
    const adminId = req.user?.userId;

    if (!id) {
      return res.status(400).json({ message: "User ID is required!" });
    }

    if (typeof status !== "boolean") {
      return res.status(400).json({ message: "Status must be a boolean (true/false)!" });
    }

    const updatedUser = await updateAffiliateStatus(id, status, adminId);

    return res.status(200).json({
      message: `Affiliate request has been ${status ? "approved" : "rejected"} successfully!`,
      user: updatedUser,
    });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

// remove affliate request
const removeAffiliateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; 
    console.log(id); 

    if (!id) {
      return res.status(400).json({ message: "User ID is required!" });
    }

    const adminId = req.user?.userId;
    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized request!" });
    }

    await removeAffiliateUserService(id); // Pass `id` instead of `userId`

    return res.status(200).json({
      message: "Affiliate status removed successfully!",
    });

  } catch (error) {
    console.error("Error:", error);
    return res.status(400).json({ message: (error as Error).message });
  }
};


export default { requestAffiliate , fetchAffiliateUsers , approveOrRejectAffiliate , removeAffiliateUser };




