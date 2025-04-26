import { Request, Response, NextFunction } from "express";
import { AppError } from "../utilities/errors";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // Assuming req.user is set by authentication middleware
  if (!req.user || req.user.role !== "admin") {
    return next(new AppError("Admin access required", 403));
  }
  next();
}
