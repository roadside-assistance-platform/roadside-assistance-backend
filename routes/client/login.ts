import { Router } from "express";
import passport from "../../utilities/passport";
const router = Router();
router.post(
  "/login/client",
  passport.authenticate("client-local", {
    successRedirect: "/home",
    failureRedirect: "/login",
  })
);
export default router;