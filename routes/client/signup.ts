/**
 * @swagger
 * components:
 *   schemas:
 *     Client:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - fullName
 *         - phone
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           example: password123
 *         fullName:
 *           type: string
 *           example: John Doe
 *         phone:
 *           type: string
 *           example: "+1234567890"
 *         photo:
 *           type: string
 *           format: uri
 *           example: "http://example.com/photo.jpg"
 *           nullable: true
 */

/**
 * @swagger
 * /client/signup:
 *   post:
 *     summary: Create a new client
 *     tags: 
 *       - Client
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Client'
 *     responses:
 *       201:
 *         description: Client created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 *       400:
 *         description: Bad request, missing required fields or client already exists
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "All fields are required: email, password, fullName, phone"
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "An error occurred while creating the client"
 */

import prisma from "../../app";
import { hashPassword } from "../../utilities/bcrypt";
import { Router } from "express";
import logger from "../../utilities/logger";
const router = Router();

const createUser = async (role: string, data: any) => {
  if (role === "client") {
    return await prisma.client.create({ data });
  } else {
    return await prisma.provider.create({ data });
  }
};

router.post("/", async (req: any, res: any) => {
  const { email, password, fullName, phone, photo } = req.body;
  if (!email || !password || !fullName || !phone) {
    logger.error("All fields are required: email, password, fullName, phone");
    return res.status(400).send("All fields are required: email, password, fullName, phone");
  }

  try {
    const existingUser = await prisma.client.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });
    if (existingUser) {
      logger.error("Client with this email or phone already exists");
      return res.status(400).send("Client with this email or phone already exists");
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await createUser("client", { email, password: hashedPassword, fullName, phone, photo: photo || null });
    logger.info(`New client created: ${email}`);
    res.status(201).json(newUser);
  } catch (error) {
    logger.error(error);
    res.status(500).send("An error occurred while creating the client");
  }
});

export default router;
