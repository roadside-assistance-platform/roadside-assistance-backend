import { Request, Response, NextFunction } from "express";

// Interface for user with role
interface UserWithRole {
  role: 'client' | 'provider';
}

import { AuthenticationError } from '../errors/authentication.error';
import { catchAsync } from '../utilities/catchAsync';

// Middleware to ensure the user is authenticated
export const isAuthenticated = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  throw new AuthenticationError('Authentication required. Please log in.');
});

// Middleware to allow only authenticated clients
export const isClient = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    throw new AuthenticationError('Authentication required. Please log in.');
  }

  const user = req.user as UserWithRole;
  if (!user || user.role !== 'client') {
    throw new AuthenticationError('Access denied. Client access required.');
  }

  next();
});

// Middleware to allow only authenticated providers
export const isProvider = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    throw new AuthenticationError('Authentication required. Please log in.');
  }

  const user = req.user as UserWithRole;
  if (!user || user.role !== 'provider') {
    throw new AuthenticationError('Access denied. Provider access required.');
  }

  next();
});
