import { Request, Response, NextFunction } from "express";

// Define the structure of user permissions (optional, depending on your project setup)
interface UserPayload {
  userId: string;
  role:string;
  permissions: string[];
}

export const checkPermission = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userPayload = req.user as UserPayload | undefined;

    if (!userPayload) {
      return res.status(403).json({ message: "User not authenticated" });
    }

    const { permissions } = userPayload;

    // Ensure the permissions array exists and is valid
    if (!permissions || !Array.isArray(permissions)) {
      console.warn("Permissions missing or invalid, skipping permission check.");
      return next(); // Allow access if permissions are not required
    }

    const hasPermission = requiredPermissions.some((perm) => permissions.includes(perm));

    if (!hasPermission) {
      return res.status(403).json({ message: "You do not have permission to perform this action" });
    }

    next();
  };
};
