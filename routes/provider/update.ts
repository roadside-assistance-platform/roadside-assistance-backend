/**
 * @swagger
 * /provider/update/{id}:
 *   put:
 *     summary: Update an existing provider
 *     tags:
 *       - Provider
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The provider ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newemail@example.com
 *               password:
 *                 type: string
 *                 example: newpassword123
 *               fullName:
 *                 type: string
 *                 example: John Updated
 *               phone:
 *                 type: string
 *                 example: "+9876543210"
 *               photo:
 *                 type: string
 *                 format: uri
 *                 example: "http://example.com/newphoto.jpg"
 *               serviceCategory:
 *                 type: string
 *                 enum: ["TOWING", "BATTERY", "FUEL", "LOCKOUT", "TIRE"]
 *                 example: "TOWING"
 *     responses:
 *       200:
 *         description: Provider updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Provider'
 *       400:
 *         description: Bad request, invalid ID
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Invalid provider ID"
 *       404:
 *         description: Provider not found
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Provider not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "An error occurred while updating the provider"
 */

import { Router, Request, Response, NextFunction } from "express";
import prisma from "../../app";
import { hashPassword } from "../../utilities/bcrypt";
import logger from "../../utilities/logger";
import { isProvider } from "../../middleware/auth";
import { validateRequest } from "../../middleware/validation";

const router = Router();

// Validation rules for provider update
const providerUpdateRules = {
  email: { type: 'string', format: 'email', optional: true },
  password: { type: 'string', min: 8, optional: true },
  fullName: { type: 'string', min: 2, optional: true },
  phone: { type: 'string', pattern: /^\+?[1-9]\d{1,14}$/, optional: true },
  photo: { type: 'string', format: 'uri', optional: true },
  serviceCategory: { type: 'string', optional: true, enum: ['TOWING','BATTERY','FUEL','LOCKOUT','TIRE'] }
};

import { catchAsync } from '../../utilities/catchAsync';

router.put("/:id", validateRequest(providerUpdateRules), catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!id) {
    logger.error("Provider ID is required");
    return res.status(400).send("Provider ID is required");
  }

  try {
    const existingUser = await prisma.provider.findUnique({ where: { id } });
    if (!existingUser) {
      logger.error("Provider not found");
      return res.status(404).send("Provider not found");
    }

    if (Object.keys(updateData).length === 0) {
      logger.error("No fields provided for update");
      return res.status(400).send("No fields provided for update");
    }

    if (updateData.password) {
      updateData.password = await hashPassword(updateData.password);
    }

    const updatedUser = await prisma.provider.update({
      where: { id },
      data: updateData
    });



    logger.info(`Provider updated successfully`);
    res.status(200).json(updatedUser);
  } catch (error) {
    logger.error(`Error updating provider:`, error);
    res.status(500).send("An error occurred while updating the provider");
  }
}));

export default router;
