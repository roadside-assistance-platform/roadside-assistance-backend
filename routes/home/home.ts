import Router from "express";
import e, { Request, Response } from "express";
const router = Router();

router.get("/", (req: Request, res: Response) => {
  if (req.isAuthenticated()) {
    res.status(200).send("Success! You are logged in.");
  } else {
    res.redirect("/login");
  }
});

export default router;
