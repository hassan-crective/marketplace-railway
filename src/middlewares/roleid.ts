import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticateJWTIdbyRole = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization header missing or malformed" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "JWT secret not configured" });
    }

    const userPayload = jwt.verify(token, secret) as JwtPayload;

    if (!userPayload?.userId || !userPayload?.email || !userPayload?.role) {
      return res.status(403).json({ message: "Invalid token payload" });
    }

    // Set user info
    req.user = {
      id: userPayload.userId,
      email: userPayload.email,
      role: userPayload.role,
    };

    console.log("Authenticated User:", req.user);
    
    next();
  } catch (error) {
    console.error("JWT Error:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
 