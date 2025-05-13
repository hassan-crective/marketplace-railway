 // Middleware: verifyrole.middleware.ts
import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: {
    id: string;
  };
}

export const authenticateJWTId = (
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
    
    if (!userPayload?.userId) {
      return res.status(403).json({ message: "Invalid token payload" });
    }

    // Set both userId and user.id for compatibility
    req.userId = userPayload.userId;
    req.user = { id: userPayload.userId };
    
    next();
  } catch (error) {
    console.error("JWT Error:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};