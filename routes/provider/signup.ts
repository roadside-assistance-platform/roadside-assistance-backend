/**
 * @swagger
 * /provider:
 *   post:
 *     summary: Create a new provider
 *     description: Creates a new provider with the provided details. All fields are required.
 *     tags:
 *       - Provider
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *               - phone
 *               - photo
 *             properties:
 *               email:
 *                 type: string
 *                 description: The provider's email address.
 *                 example: provider@example.com
 *               password:
 *                 type: string
 *                 description: The provider's password (will be hashed before storage).
 *                 example: securePassword123
 *               fullName:
 *                 type: string
 *                 description: The provider's full name.
 *                 example: Jane Doe
 *               phone:
 *                 type: string
 *                 description: The provider's phone number.
 *                 example: +1234567890
 *               photo:
 *                 type: string
 *                 description: URL or base64-encoded string of the provider's photo.
 *                 example: https://example.com/photo.jpg
 *     responses:
 *       201:
 *         description: Provider created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Provider'
 *       400:
 *         description: Bad request. Missing required fields or provider with the same email/phone already exists.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: All fields are required: email, password, fullName, phone, photo
 *       500:
 *         description: Internal server error occurred while creating the provider.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: An error occurred while creating the provider
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
  if (!email || !password || !fullName || !phone || !photo) {
    logger.error("All fields are required: email, password, fullName, phone, photo");
    return res.status(400).send("All fields are required: email, password, fullName, phone, photo");
  }

  try {
    const existingUser = await prisma.provider.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });
    if (existingUser) {
      logger.error("Provider with this email or phone already exists");
      return res.status(400).send("Provider with this email or phone already exists");
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await createUser("provider", { email, password: hashedPassword, fullName, phone, photo });
    logger.info(`New provider created: ${email}`);
    res.status(201).json(newUser);
    
  } catch (error) {
    logger.error(error);
    res.status(500).send("An error occurred while creating the provider");
  }
});
export default router;
