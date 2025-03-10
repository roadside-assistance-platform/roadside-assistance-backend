import {Router} from "express";
import passport from "../../utilities/passport";
import logger from "../../utilities/logger";
const router = Router();


router.get(
  "/auth/google/client",
  passport.authenticate("google-client", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/client/callback",
  passport.authenticate("google-client", { failureRedirect: "/auth/google/client/failure" }),
  (req, res) => {
    logger.info("Google authentication successful for client");
    res.json({ message: "Google authentication successful", user: req.user });
  }
);

router.get("/auth/google/client/failure", (req, res) => {
  logger.error("Google authentication failed for client");
  res.status(401).json({ message: "Google authentication failed for client" });
});


export default router;