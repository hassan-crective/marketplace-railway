import { Request, Response, NextFunction } from "express";
import { Others } from "../enums/others.enum";  
import { AuthenticatedRequest } from "./roleid";
 
 
 
export const authorizeRoleBase = (...allowedRoles: Others.role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    const { role } = req.user;

    console.log(`User Role: ${role}, Allowed Roles: ${allowedRoles}`);  

    if (!allowedRoles.includes(role as Others.role)) {
      return res.status(403).json({ message: "Access denied. Insufficient role." });
    }

    next();
  };
};