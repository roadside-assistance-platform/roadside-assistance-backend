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
