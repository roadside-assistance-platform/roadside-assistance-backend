/**
 * @swagger
 * /client/login:
 *   post:
 *     summary: Authenticate and log in a client
 *     description: Authenticates a client using the local strategy and logs them into the system.
 *     tags:
 *       - Client
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: The client's email or username.
 *                 example: client@example.com
 *               password:
 *                 type: string
 *                 description: The client's password.
 *                 example: password123
 *     responses:
 *       200:
 *         description: Client authenticated and logged in successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 client:
 *                   $ref: '#/components/schemas/Client'
 *       401:
 *         description: Authentication failed due to invalid credentials.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Authentication failed
 *                 info:
 *                   type: object
 *                   description: Additional information about the failure.
 *                   example: {}
 *       500:
 *         description: Internal server error occurred during authentication.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
import { Router, Request, Response, NextFunction } from "express";
import passport from "../../utilities/passport";
import {Client} from "@prisma/client"// Ensure this matches your Client type definition
import logger from "../../utilities/logger";

const router = Router();

router.post("/", (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("client-local", (err: Error | null, Client: Client | false, info: unknown) => {
    if (err){
      logger.error("Error logging in client:", err);
      return next(err);
    }  // Handle errors

    if (!Client) {
      logger.error({ message: "Authentication failed", info }); // Log before returning
      return res.status(401).json({ message: "Authentication failed", info });
    }

    req.logIn(Client, (loginErr: Error | null) => {
      if (loginErr) {
        logger.error({ message: "Error logging in client", loginErr });
        return next(loginErr);}

      logger.info(`Client logged in: ${Client.email}`); // Use info level for successful login
      return res.json({ message: "Login successful", Client });
    });
  })(req, res, next);
});


export default router;
