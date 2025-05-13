import { UserRepository } from "../repositories";
import { ISortPaging } from "../utils/sortPagination";


// affliate request
export class UserService {
  static async requestAffiliate(userId: string) {
    const user = await UserRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error("User not found!");
    }
    // Check if user already requested affiliation
    if (user.isaffiliateRequested) {
      throw new Error("Affiliate request already submitted!");
    }
    // Update user affiliate request status
    user.isaffiliateRequested = true;
    await UserRepository.save(user);

    return user;
  }
}
// get affliate user
const getAffiliateUsers = async (status: string, sortPaging: ISortPaging) => {
  let whereCondition: any = {};

  if (status === "pending") {
    whereCondition = { isaffiliateRequested: true, isAffiliate: false };
  } else if (status === "approved") {
    whereCondition = { isaffiliateRequested: true, isAffiliate: true };
  } else if (status === "rejected") {
    whereCondition = { isaffiliateRequested: false, isAffiliate: false };
  } else if (status === "all") {
   
    whereCondition = { isaffiliateRequested: true }; 
    throw new Error("Invalid status parameter! Use 'pending', 'approved', 'rejected', or 'all'.");
  }
  console.log("Where Condition:", whereCondition);

  const { sort, skip, limit } = sortPaging;

  const users = await UserRepository.find({
    where: whereCondition,
    select: ["id", "firstName", "lastName", "email", "isAffiliate", "isaffiliateRequested"],
    skip: skip,
    take: limit,
    order: sort,
  });

  console.log("Fetched Users:", users);
  return users;
};

// approve and reject affliate requests
const updateAffiliateStatus = async (userId: string, status: boolean, adminId: string) => {
  const user = await UserRepository.findOne({ where: { id: userId } });

  if (!user) {
    throw new Error("User not found!");
  }

  if (status === true) {
    user.isAffiliate = true;
    user.isaffiliateRequested = true;
    user.approvedby = adminId;
  } else {
    user.isAffiliate = false;
    user.isaffiliateRequested = false;

  }

  await UserRepository.save(user);

  return user;
};

// remove affliateUser
export const removeAffiliateUserService = async (userId: string) => {
 const user = await UserRepository.findOne({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found!");
  }
  if (!user.isAffiliate && !user.isaffiliateRequested) {
    throw new Error("User is not an affiliate!");
  }
  // Update user fields
  user.isaffiliateRequested = false;
  user.isAffiliate = false;

  await UserRepository.save(user);
};


export { getAffiliateUsers, updateAffiliateStatus };

