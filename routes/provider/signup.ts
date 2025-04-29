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

/**
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
 *         serviceCategories:
 *           type: array
 *           items:
 *             type: string
 *             enum: ["TOWING", "FLAT_TIRE", "FUEL_DELIVERY", "LOCKOUT", "EMERGENCY", "OTHER"]
 *           example: ["TOWING", "FUEL_DELIVERY"]
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
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Signup successful, user is logged in
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         fullName:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         photo:
 *                           type: string
 *                         serviceCategories:
 *                           type: array
 *                           items:
 *                             type: string
 *                         averageRating:
 *                           type: number
 *                           nullable: true
 *                         role:
 *                           type: string
 *                           example: provider
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
  const { email, password, fullName, phone, photo, serviceCategories } = req.body;
  if (!('email' in req.body) || !('password' in req.body) || !('serviceCategories' in req.body) || !('fullName' in req.body) || !('phone' in req.body) || !('photo' in req.body)) {
    logger.error("All fields are required: email, password, serviceCategories, fullName, phone, photo");
    return res.status(400).send("All fields are required: email, password, serviceCategories, fullName, phone, photo");
  }

  // Validate serviceCategories as array
  const allowedCategories = ["TOWING", "FLAT_TIRE", "FUEL_DELIVERY", "LOCKOUT", "EMERGENCY", "OTHER"];
  if (!Array.isArray(serviceCategories) || serviceCategories.length === 0 || !serviceCategories.every((cat: string) => allowedCategories.includes(cat))) {
    logger.error(`Invalid serviceCategories: ${JSON.stringify(serviceCategories)}`);
    return res.status(400).send(`Invalid serviceCategories. Allowed values (array): ${allowedCategories.join(", ")}`);
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

    // Find the Field by the first serviceCategories (for fieldId)
    const field = await prisma.field.findUnique({ where: { name: serviceCategories[0] } });
    if (!field) {
      logger.error(`Field for serviceCategories ${serviceCategories[0]} not found`);
      return res.status(400).send("Invalid service category.");
    }
    const hashedPassword = await hashPassword(password);
    const newUser = await createUser("provider", { email, password: hashedPassword, fullName, phone, photo, serviceCategories, fieldId: field.id, isApproved: false });

    // Fetch the provider again to get averageRating
    const fullProvider = await prisma.provider.findUnique({ where: { id: newUser.id } });

    logger.info(`New provider created: ${email}`);
    
    // Ensure serviceCategories is present on user object for response
    const userWithRole = { ...fullProvider, role: 'provider', serviceCategories };
    
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
            serviceCategories: userWithRole.serviceCategories,
            averageRating: userWithRole.averageRating ?? null,
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
