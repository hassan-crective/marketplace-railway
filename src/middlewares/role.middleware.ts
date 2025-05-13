import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
 
export const authorizeRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authorization header missing or invalid" });
      }

      const token = authHeader.split(" ")[1];

      if (!token) {
        return res.status(401).json({ message: "Token not provided" });
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        console.error("JWT_SECRET is missing in .env");
        return res.status(500).json({ message: "Server error: Missing JWT secret" });
      }

      // Verify and decode the token
      const decodedToken = jwt.verify(token, secret) as JwtPayload;

      if (!decodedToken || typeof decodedToken.role !== "string") {
        return res.status(403).json({ message: "Access denied. No valid role found." });
      }

      const userRole = decodedToken.role.trim().toLowerCase(); // Ensure clean comparison
      const normalizedAllowedRoles = allowedRoles.map((role) => role.toLowerCase());

      console.log("Authorization Debug:", { userRole, allowedRoles: normalizedAllowedRoles });

      if (!normalizedAllowedRoles.includes(userRole)) {
        return res.status(403).json({
          message: `Access denied. Your role: ${userRole}, Allowed roles: ${normalizedAllowedRoles.join(", ")}`,
        });
      }

      next();
    } catch (error) {
      console.error("JWT Verification Error:", error);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
};
