import prisma from "../app";
import { hashPassword } from "../utilities/bcrypt";
import { Router } from "express";
const router = Router();
router.post("/create", async (req: any, res: any) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).send("Email, password, and role are required");
  }

  try {
    const existingUser =
      role === "client"
        ? await prisma.client.findUnique({ where: { email } })
        : await prisma.provider.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(400).send("User already exists");
    }

    const hashedPassword = await hashPassword(password);
    const newUser =
      role === "client"
        ? await prisma.client.create({ data: { email, password: hashedPassword } })
        : await prisma.provider.create({ data: { email, password: hashedPassword } });

    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while creating the user");
  }
});