import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps async route handlers to forward errors to Express error handler.
 */
const catchAsync = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default catchAsync;
