import express, { Request, Response, NextFunction } from "express";
import passport from "../utilities/passport";
import logger from "../utilities/logger";
import { AppError } from "../utilities/errors";
import { catchAsync } from "../utilities/catchAsync";

const router = express.Router();

// POST /login (admin, client, provider)
router.post(
  "/",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body.email || !req.body.password) {
      throw new AppError("Please provide email and password", 400);
    }
    // Try admin login first
    passport.authenticate("admin-local", (err, user, info) => {
      if (err) {
        logger.error("Error during admin authentication:", { error: err, email: req.body.email });
        return next(new AppError("Authentication error occurred", 500));
      }
      if (user) {
        req.logIn(user, (err) => {
          if (err) return next(new AppError("Error logging in", 500));
          logger.info("Admin login successful:", { email: user.email });
          return res.status(200).json({
            status: "success",
            message: "Admin login successful",
            user: { id: user.id, email: user.email, role: user.role },
          });
        });
        return;
      }
      // Try client login
      passport.authenticate("client-local", (err, user, info) => {
        if (err) {
          logger.error("Error during client authentication:", { error: err, email: req.body.email });
          return next(new AppError("Authentication error occurred", 500));
        }
        if (user) {
          req.logIn(user, (err) => {
            if (err) return next(new AppError("Error logging in", 500));
            logger.info("Client login successful:", { email: user.email });
            return res.status(200).json({
              status: "success",
              message: "Client login successful",
              user: { id: user.id, email: user.email, role: user.role },
            });
          });
          return;
        }
        // Try provider login
        passport.authenticate("provider-local", (err, user, info) => {
          if (err) {
            logger.error("Error during provider authentication:", { error: err, email: req.body.email });
            return next(new AppError("Authentication error occurred", 500));
          }
          if (user) {
            req.logIn(user, (err) => {
              if (err) return next(new AppError("Error logging in", 500));
              logger.info("Provider login successful:", { email: user.email });
              return res.status(200).json({
                status: "success",
                message: "Provider login successful",
                user: { id: user.id, email: user.email, role: user.role },
              });
            });
            return;
          }
          // No user found
          return next(new AppError("Invalid credentials", 401));
        })(req, res, next);
      })(req, res, next);
    })(req, res, next);
  })
);

export default router;
