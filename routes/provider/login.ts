import { Router } from "express";
const router = Router();  
import passport from "../../utilities/passport";

router.post(
  "/login/provider",
  passport.authenticate("provider-local", {
    successRedirect: "/home",
    failureRedirect: "/login",
  })
);

export default router;