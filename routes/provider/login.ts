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
