

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
};/**
* @swagger
* components:
*   schemas:
*     Provider:
*       type: object
*       required:
*         - email
*         - password
*         - fullName
*         - phone
*         - photo
*       properties:
*         email:
*           type: string
*           format: email
*           example: provider@example.com
*         password:
*           type: string
*           example: Password123!
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
*/

/**
* @swagger
* /provider/signup:
*   post:
*     summary: Create a new provider
*     tags: 
*       - Provider
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/Provider'
*     responses:
*       201:
*         description: Provider created successfully
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/Provider'
*       400:
*         description: Bad request, missing required fields or provider already exists
*         content:
*           text/plain:
*             schema:
*               type: string
*               example: "All fields are required: email, password, fullName, phone, photo"
*       500:
*         description: Internal server error
*         content:
*           text/plain:
*             schema:
*               type: string
*               example: "An error occurred while creating the provider"
*/


router.post("/", async (req: any, res: any) => {
  const { email, password, fullName, phone, photo } = req.body;
  if (!('email' in req.body) || !('password' in req.body) || !('fullName' in req.body) || !('phone' in req.body) || !('photo' in req.body)) {
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
    
    // Add role to the user object before login
    const userWithRole = { ...newUser, role: 'provider' };
    
    req.login(userWithRole, (err: any) => {
      if (err) {
        logger.error('Error logging in after signup:', err);
        return res.status(500).json({
          status: 'error',
          message: 'Failed to login after signup',
          error: err.message
        });
      }

      res.status(201).json({
        status: 'success',
        message: 'Signup successful, user is logged in',
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            fullName: newUser.fullName,
            phone: newUser.phone,
            photo: newUser.photo,
            role: 'provider'
          }
        }
      });
    });
  } catch (error) {
    logger.error(error);
    res.status(500).send("An error occurred while creating the provider");
  }
});
export default router;
