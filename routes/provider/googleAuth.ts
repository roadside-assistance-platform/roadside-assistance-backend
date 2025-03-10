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