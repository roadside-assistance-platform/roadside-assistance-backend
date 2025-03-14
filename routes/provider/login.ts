/**
 * @swagger
 * /provider/login:
 *   post:
 *     summary: Provider login
 *     description: Authenticates a provider using email and password and logs them in.
 *     tags:
 *       - Provider
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: provider@example.com
 *                 description: The provider's email address
 *               password:
 *                 type: string
 *                 example: password123
 *                 description: The provider's password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 Provider:
 *                   $ref: '#/components/schemas/Provider'
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Authentication failed
 *                 details:
 *                   type: string
 *                   example: Invalid email or password
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: An unexpected error occurred
 *                 details:
 *                   type: string
 *                   example: Database connection failed
 */
import { Router, Request, Response, NextFunction } from "express";
import passport from "../../utilities/passport";
import {Provider} from "@prisma/client"// Ensure this matches your Provider type definition
import logger from "../../utilities/logger";

const router = Router();

router.post("/", (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("provider-local", (err: Error | null, Provider: Provider | false, info: unknown) => {
    if (err){ 
      logger.error("Error logging in provider:", err);
      return next(err);} // Handle errors
    if (!Provider){
      logger.error("Authentication failed", info);
      return res.status(401).json({ message: "Authentication failed", info });} 

    req.logIn(Provider, (loginErr: Error | null) => {
      if (loginErr) {logger.error("Error logging in provider:");
        return next(loginErr);}
      logger.info(`Provider logged in: ${Provider.email}`);
      return res.json({ message: "Login successful", Provider });
    });
  })(req, res, next);
});

export default router;
