/**
 * @swagger
 * /client/login:
 *   post:
 *     summary: Client login
 *     description: Authenticates a client using local strategy and logs them in.
 *     tags:
 *       - Client
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: client@example.com
 *               password:
 *                 type: string
 *                 example: password123
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
 *                 Client:
 *                   $ref: '#/components/schemas/Client'
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
 *                 info:
 *                   type: object
 *                   example: {}
 *       500:
 *         description: Internal server error
 */
import { Router, Request, Response, NextFunction } from "express";
import passport from "../../utilities/passport";
import {Client} from "@prisma/client"// Ensure this matches your Client type definition

const router = Router();

router.post("/", (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("client-local", (err: Error | null, Client: Client | false, info: unknown) => {
    if (err) return next(err); // Handle errors
    if (!Client) return res.status(401).json({ message: "Authentication failed", info });

    req.logIn(Client, (loginErr: Error | null) => {
      if (loginErr) return next(loginErr);
      return res.json({ message: "Login successful", Client });
    });
  })(req, res, next);
});

export default router;
