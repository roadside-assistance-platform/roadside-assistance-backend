


/**
 * @swagger
 * tags:
 *   name: GoogleAuth
 *   description: Google Authentication API
 */

/**
 * @swagger
 * /google/verify:
 *   post:
 *     summary: Authenticate user using Google ID token
 *     tags: [GoogleAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token
 *               role:
 *                 type: string
 *                 description: User role (client or provider)
 *     responses:
 *       200:
 *         description: Token verified and user logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Missing ID token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       401:
 *         description: Invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
import express, { Request, Response } from "express";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import prisma from "../app";
import { hashPassword } from "../utilities/bcrypt";
import crypto from "crypto";
import logger from "../utilities/logger";

const router = express.Router();
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const client = new OAuth2Client(CLIENT_ID);

const generateRandomPassword = (): string =>
  crypto.randomBytes(16).toString("hex");

async function verifyGoogleToken(token: string): Promise<TokenPayload | null> {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });
    return ticket.getPayload() || null;
  } catch (error) {
    logger.error("Error verifying Google token", error);
    return null;
  }
}

const findOrCreateUser = async (role: string, email: string, name: string, picture: string | null) => {
  let user = null;
  if (role === "client") {
    user = await prisma.client.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.client.create({
        data: {
          email,
          fullName: name || "No Name Provided",
          password: await hashPassword(generateRandomPassword()),
          photo: picture || null,
        },
      });
      logger.info(`New client created: ${email}`);
    }
  } else {
    user = await prisma.provider.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.provider.create({
        data: {
          email,
          fullName: name || "No Name Provided",
          password: await hashPassword(generateRandomPassword()),
          photo: picture || null,
        },
      });
      logger.info(`New provider created: ${email}`);
    }
  }
  return user;
};

router.post("/", async (req: any, res: any) => {
  const { idToken, role } = req.body;

  if (!idToken) {
    logger.error("Missing ID token");
    return res.status(400).json({ error: "Missing ID token" });
  }

  const userRole = role && role.toLowerCase() === "provider" ? "provider" : "client";

  try {
    const payload = await verifyGoogleToken(idToken);
    if (!payload || !payload.email) {
      logger.error("Invalid Google token");
      return res.status(401).json({ error: "Invalid token" });
    }

    const { email, name, picture } = payload;
    const user = await findOrCreateUser(userRole, email, name || "No Name Provided", picture || "");

    req.logIn(user, (err:any) => {
      if (err) {
        logger.error("Error logging in user", err);
        return res.status(500).json({ error: "Error logging in user" });
      }
      return res.status(200).json({
        message: "Token verified and user logged in",
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: userRole,
        },
      });
    });
  } catch (error) {
    logger.error("Unexpected error during authentication", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
