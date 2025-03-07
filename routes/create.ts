/**
 * @swagger
 * /create:
 *   post:
 *     summary: Create a new user
 *     description: Creates a new user with the provided email, password, and role. The role can be either "client" or "provider".
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email of the user.
 *               password:
 *                 type: string
 *                 description: The password of the user.
 *               role:
 *                 type: string
 *                 enum: [client, provider]
 *                 description: The role of the user.
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The ID of the created user.
 *                 email:
 *                   type: string
 *                   description: The email of the created user.
 *                 role:
 *                   type: string
 *                   description: The role of the created user.
 *       400:
 *         description: Bad request. Email, password, and role are required or user already exists.
 *       500:
 *         description: Internal server error.
 */
import prisma from "../app";
import { hashPassword } from "../utilities/bcrypt";
import { Router } from "express";
const router = Router();


router.post("/", async (req: any, res: any) => {
  const { email, password, role } = req.body;
  console.log(email, password, role);
  if (!email || !password || !role) {
    return res.status(400).send("Email, password, and role are required");
  }

  try {
    let existingUser;
    if (role === "client") {
      existingUser = await prisma.client.findUnique({ where: { email } });
    } else {
      existingUser = await prisma.provider.findUnique({ where: { email } });
    }

    if (existingUser) {
      return res.status(400).send("User already exists");
    }

    const hashedPassword = await hashPassword(password);
    let newUser;
    if (role === "client") {
      newUser = await prisma.client.create({ data: { email, password: hashedPassword } });
    } else {
      newUser = await prisma.provider.create({ data: { email, password: hashedPassword } });
    }

    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while creating the user");
  }
});

export default router;