import {Router} from "express";
import passport from "../../utilities/passport";
const router = Router();

router.get(
  "/auth/google/provider",
  passport.authenticate("google-provider", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/provider/callback",
  passport.authenticate("google-provider", { failureRedirect: "/auth/google/provider/failure" }),
  (req, res) => {
    res.json({ message: "Google authentication successful", user: req.user });
  }
);

router.get("/auth/google/provider/failure", (req, res) => {
  res.status(401).json({ message: "Google authentication failed for provider" });
});

export default router;