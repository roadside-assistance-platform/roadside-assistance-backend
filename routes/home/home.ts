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
import logger from "../../utilities/logger";
const router = Router();

router.get("/", (req: Request, res: Response) => {
logger.info("Home page accessed");
res.send("Success! You are in home.");});


export default router;
