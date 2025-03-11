import { Router } from "express";
import passport from "../../utilities/passport";
import logger from "../../utilities/logger";

const router = Router();

/**
 * @swagger
 * 
 * /auth/google/client:
 *   get:
 *     tags:
 *       - Client
 *     summary: Initiates Google authentication for the client
 *     description: Redirects the user to Google's OAuth2 authentication page.
 *     responses:
 *       302:
 *         description: Redirect to Google's OAuth2 page.
 */

router.get(
  "/auth/google/client",
  passport.authenticate("google-client", { scope: ["profile", "email"] })
);

/**
 * @swagger
 * /auth/google/client/callback:
 *   get:
 *     tags:
 *       - Client
 *     summary: Google authentication callback
 *     description: Handles the callback from Google's OAuth2 authentication.
 *     responses:
 *       200:
 *         description: Google authentication successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Google authentication successful"
 *                 user:
 *                   type: object
 *                   description: The authenticated user object.
 *       401:
 *         description: Google authentication failed.
 */

router.get(
  "/auth/google/client/callback",
  passport.authenticate("google-client", { failureRedirect: "/auth/google/client/failure" }),
  (req, res) => {
    logger.info("Google authentication successful for client");
    res.json({ message: "Google authentication successful", user: req.user });
  }
);

/**
 * @swagger
 * /auth/google/client/failure:
 *   get:
 *     tags:
 *       - Client
 *     summary: Google authentication failure
 *     description: Handles the failure case for Google authentication.
 *     responses:
 *       401:
 *         description: Google authentication failed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Google authentication failed for client"
 */

router.get("/auth/google/client/failure", (req, res) => {
  logger.error("Google authentication failed for client");
  res.status(401).json({ message: "Google authentication failed for client" });
});

export default router;
