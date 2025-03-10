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