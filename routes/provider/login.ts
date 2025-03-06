/**
 * @swagger
 * components:
 *   schemas:
 *     Provider:
 *       type: object
 *       required:
 *         - id
 *         - email
 *       properties:
 *         id:
 *           type: string
 *           description: The provider's unique ID
 *         email:
 *           type: string
 *           format: email
 *           description: The provider's email
 *         name:
 *           type: string
 *           description: The provider's name
 * 
 * /provider/login:
 *   post:
 *     summary: Provider login
 *     description: Authenticates a provider using local strategy and logs them in.
 *     tags:
 *       - Provider
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: provider@example.com
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
 *                 info:
 *                   type: object
 *                   example: {}
 *       500:
 *         description: Internal server error
 */
import { Router, Request, Response, NextFunction } from "express";
import passport from "../../utilities/passport";
import {Provider} from "@prisma/client"// Ensure this matches your Provider type definition

const router = Router();

router.post("/", (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("provider-local", (err: Error | null, Provider: Provider | false, info: unknown) => {
    if (err) return next(err); // Handle errors
    if (!Provider) return res.status(401).json({ message: "Authentication failed", info });

    req.logIn(Provider, (loginErr: Error | null) => {
      if (loginErr) return next(loginErr);
      return res.json({ message: "Login successful", Provider });
    });
  })(req, res, next);
});

export default router;
