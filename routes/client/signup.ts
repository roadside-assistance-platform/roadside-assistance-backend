/**
 * @swagger
 * /client:
 *   post:
 *     summary: Create a new client
 *     description: Creates a new client with the provided details. All fields are required.
 *     tags:
 *       - Client
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
 *                 description: The client's email address.
 *                 example: client@example.com
 *               password:
 *                 type: string
 *                 description: The client's password (will be hashed before storage).
 *                 example: securePassword123
 *               fullName:
 *                 type: string
 *                 description: The client's full name.
 *                 example: John Doe
 *               phone:
 *                 type: string
 *                 description: The client's phone number.
 *                 example: +1234567890
 *               photo:
 *                 type: string
 *                 description: URL or base64-encoded string of the client's photo.
 *                 example: https://example.com/photo.jpg
 *     responses:
 *       201:
 *         description: Client created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 *       400:
 *         description: Bad request. Missing required fields or client with the same email/phone already exists.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: All fields are required: email, password, fullName, phone, photo
 *       500:
 *         description: Internal server error occurred while creating the client.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: An error occurred while creating the client
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
    const newUser = await createUser("client", { email, password: hashedPassword, fullName, phone, photo });
logger.info(`New client created: ${email}`);
    res.status(201).json(newUser);
  } catch (error) {
    logger.error(error);
    res.status(500).send("An error occurred while creating the client");
  }
});
export default router;
