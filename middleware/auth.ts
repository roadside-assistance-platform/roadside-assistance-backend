import { Request, Response, NextFunction } from "express";
import { AuthenticationError } from '../errors/authentication.error';
import { catchAsync } from '../utilities/catchAsync';
import logger from '../utilities/logger';

// Interface for user with role
interface UserWithRole {
  role: 'client' | 'provider' | 'admin';
}

// Middleware to allow only admin users
export const isAdmin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    throw new AuthenticationError('Authentication required. Please log in.');
  }
  const user = req.user as UserWithRole;
  if (!user || user.role !== 'admin') {
    throw new AuthenticationError('Access denied. Admin access required.');
  }
  next();
});

// Middleware to ensure the user is authenticated
export const isAuthenticated = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.isAuthenticated && req.isAuthenticated()) {
      // Log the authenticated user for debugging
      if (process.env.NODE_ENV === 'development') {
        logger.info(`Authenticated user: ${JSON.stringify(req.user)}`);
      }
      return next();
    }
    
    // If not authenticated, check if this is an API request
    const isApiRequest = req.path.startsWith('/api/') || req.get('Accept')?.includes('application/json');
    
    if (isApiRequest) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        authenticated: false
      });
    }
    
    // For non-API requests, redirect to login
    throw new AuthenticationError('Authentication required. Please log in.');
    
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error instanceof AuthenticationError) {
      throw error;
    }
    
    // For any other error, return a generic authentication error
    if (req.get('Accept')?.includes('application/json')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication error',
        authenticated: false
      });
    }
    
    throw new AuthenticationError('Authentication error');
  }
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
