import { Request, Response, NextFunction } from "express";

// Middleware to ensure the user is authenticated
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  // req.isAuthenticated is added by Passport when using sessions
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "User is not authenticated" });
};

// Middleware to allow only authenticated clients
export const isClient = (req: Request, res: Response, next: NextFunction) => {
  if (
    req.isAuthenticated &&
    req.isAuthenticated() &&
    req.user &&
    // The role property is manually attached in your Passport strategies
    (req.user as any).role === "client"
  ) {
    return next();
  }
  res.status(403).json({ message: "Access denied: Clients only" });
};

// Middleware to allow only authenticated providers
export const isProvider = (req: Request, res: Response, next: NextFunction) => {
  if (
    req.isAuthenticated &&
    req.isAuthenticated() &&
    req.user &&
    (req.user as any).role === "provider"
  ) {
    return next();
  }
  res.status(403).json({ message: "Access denied: Providers only" });
};
