import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  // Check if the Authorization header is missing
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  // Extract the token from the Authorization header
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token not provided" });
  }

  try {
    const secret = process.env.JWT_SECRET!;
    
    // Verify the token
    const decoded = jwt.verify(token, secret) as JwtPayload;
    console.log("Decoded payload:", decoded);

    // Check if the payload is valid
    if (!decoded || !decoded.userId) {
      return res.status(403).json({ message: "Invalid token payload" });
    }

    // Attach the decoded payload to the request object
    req.user = decoded;

    // Pass control to the next middleware or route handler
    next();
  } catch (error: any) {
    // Handle specific JWT errors for better responses
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Generic error handling
    console.error("Error in authenticateJWT middleware:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
