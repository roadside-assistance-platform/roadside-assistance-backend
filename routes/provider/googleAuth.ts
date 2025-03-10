/**
 * @swagger
 * /auth/google/provider:
 *   get:
 *     summary: Initiate Google OAuth2 authentication for providers
 *     description: Redirects the provider to Google's OAuth2 authentication page to grant access to their profile and email.
 *     tags:
 *       - Provider
 *     responses:
 *       302:
 *         description: Redirect to Google's OAuth2 authentication page.
 */

/**
 * @swagger
 * /auth/google/provider/callback:
 *   get:
 *     summary: Google OAuth2 callback for providers
 *     description: Handles the callback from Google's OAuth2 authentication. If successful, logs the provider in and returns their details.
 *     tags:
 *       - Provider
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
 *                   example: Google authentication successful
 *                 user:
 *                   $ref: '#/components/schemas/Provider'
 *       401:
 *         description: Google authentication failed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Google authentication failed for provider
 */

/**
 * @swagger
 * /auth/google/provider/failure:
 *   get:
 *     summary: Google OAuth2 authentication failure for providers
 *     description: Handles the failure case when Google OAuth2 authentication fails for a provider.
 *     tags:
 *       - Provider
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
 *                   example: Google authentication failed for provider
 */
import {Router} from "express";
import passport from "../../utilities/passport";
import logger from "../../utilities/logger";
const router = Router();

router.get(
  "/auth/google/provider",
  passport.authenticate("google-provider", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/provider/callback",
  passport.authenticate("google-provider", { failureRedirect: "/auth/google/provider/failure" }),
  (req, res) => {
    logger.info("Google authentication successful for provider");
    res.json({ message: "Google authentication successful", user: req.user });
  }
);

router.get("/auth/google/provider/failure", (req, res) => {
  logger.error("Google authentication failed for provider");
  res.status(401).json({ message: "Google authentication failed for provider" });
});

export default router;
