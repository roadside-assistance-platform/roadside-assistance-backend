/**
 * @swagger
 * /home:
 *   get:
 *     summary: Home page
 *     description: Access the home page. Redirects to login if user is not authenticated.
 *     tags:
 *       - Home
 *     responses:
 *       200:
 *         description: User is authenticated
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Success! You are logged in.
 *       302:
 *         description: User is not authenticated, redirects to login page
 */
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
