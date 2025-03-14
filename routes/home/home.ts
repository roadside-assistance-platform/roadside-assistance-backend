/**
 * @swagger
 * /:
 *   get:
 *     summary: Home page
 *     description: Returns a success message if the user is authenticated; otherwise, redirects to the login page.
 *     tags:
 *       - Home
 *     responses:
 *       200:
 *         description: User is authenticated
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Success! You are in home.
 *       302:
 *         description: User is not authenticated and is redirected to the login page.
 */

import Router from "express";
import  { Request, Response } from "express";
import logger from "../../utilities/logger";
import { sendMail } from "../../utilities/mailsender"
const router = Router();

router.get("/", (req: Request, res: Response) => {
logger.info("Home page accessed");
sendMail(
    'ma.lachi@esi-sba.dz',
    'ma.lachi@esi-sba.dz',
    'Test Subject',
    'This is a test email.',
    '<p>This is a test email.</p>'
  );
  

res.send("Success! You are in home.");});


export default router;
