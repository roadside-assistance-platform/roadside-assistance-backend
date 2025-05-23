import { Request, Response, NextFunction } from "express";
import { AppError } from "../utilities/errors";
import prisma from "../app";

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    // Get the user from the database to verify role
    const user = await prisma.admin.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return next(new AppError("Admin access required", 403));
    }

    // Attach the admin user to the request for use in route handlers
    req.admin = user;
    next();
  } catch (error) {
    console.error("Error in requireAdmin middleware:", error);
    next(new AppError("Error verifying admin access", 500));
  }
}

// Extend the Express Request type to include the admin property
declare global {
  namespace Express {
    interface Request {
      admin?: any; // You might want to replace 'any' with your Admin type
    }
  }
}
