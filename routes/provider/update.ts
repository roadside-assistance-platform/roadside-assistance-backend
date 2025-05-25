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
 *               serviceCategories:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: ["TOWING", "FLAT_TIRE", "FUEL_DELIVERY", "LOCKOUT", "EMERGENCY", "OTHER"]
 *                 example: ["TOWING", "FUEL_DELIVERY"]
 *               isApproved:
 *                 type: boolean
 *                 example: true
 *               deleted:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Provider updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Provider updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     provider:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         email:
 *                           type: string
 *                           format: email
 *                         fullName:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         photo:
 *                           type: string
 *                           format: uri
 *                         serviceCategories:
 *                           type: array
 *                           items:
 *                             type: string
 *                             enum: ["TOWING", "FLAT_TIRE", "FUEL_DELIVERY", "LOCKOUT", "EMERGENCY", "OTHER"]
 *                         averageRating:
 *                           type: number
 *                         isApproved:
 *                           type: boolean
 *                         deleted:
 *                           type: boolean
 *                         createdAt:
 *                           type: string
 *                         updatedAt:
 *                           type: string
 *       400:
 *         description: Bad request, invalid provider ID or no fields provided for update
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Invalid provider ID or no fields provided for update"
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
import { validateRequest } from "../../middleware/validation";

const router = Router();

// Validation rules for provider update
const providerUpdateRules = {
  email: { type: 'string', format: 'email', optional: true },
  password: { type: 'string', min: 8, optional: true },
  fullName: { type: 'string', min: 2, optional: true },
  phone: { type: 'string', pattern: /^\+?[1-9]\d{1,14}$/, optional: true },
  photo: { type: 'string', format: 'uri', optional: true },
  serviceCategories: { type: 'array', items: { type: 'string', enum: ['TOWING', 'FLAT_TIRE', 'FUEL_DELIVERY', 'LOCKOUT', 'EMERGENCY', 'OTHER'] }, optional: true }
};

import { catchAsync } from '../../utilities/catchAsync';

router.put("/:id", catchAsync(async (req: any, res: any) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!id) {
    logger.error("Provider ID is required");
    return res.status(400).json({
      status: 'error',
      message: 'Provider ID is required'
    });
  }

  try {
    const existingUser = await prisma.provider.findUnique({ 
      where: { id },
      select: {
        id: true,
        email: true,
        deleted: true
      }
    });
    
    if (!existingUser) {
      logger.error("Provider not found");
      return res.status(404).json({
        status: 'error',
        message: 'Provider not found'
      });
    }

    if (Object.keys(updateData).length === 0) {
      logger.error("No fields provided for update");
      return res.status(400).json({
        status: 'error',
        message: 'No fields provided for update'
      });
    }

    // Validate serviceCategories if provided
    if (updateData.serviceCategories) {
      const allowedCategories = ["TOWING", "FLAT_TIRE", "FUEL_DELIVERY", "LOCKOUT", "EMERGENCY", "OTHER"];
      if (!Array.isArray(updateData.serviceCategories) || 
          !updateData.serviceCategories.every((cat: string) => allowedCategories.includes(cat))) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid serviceCategories. Allowed values: ${allowedCategories.join(", ")}`
        });
      }
    }

    // Hash password if provided
    if (updateData.password) {
      updateData.password = await hashPassword(updateData.password);
    }

    // Prepare update data
    const dataToUpdate = { ...updateData };
    
    const updatedUser = await prisma.provider.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        photo: true,
        serviceCategories: true,
        averageRating: true,
        isApproved: true,
        deleted: true,
        createdAt: true,
        updatedAt: true
      }
    });

    logger.info(`Provider updated successfully: ${id}`);
    
    return res.status(200).json({
      status: 'success',
      message: 'Provider updated successfully',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    logger.error(`Error updating provider:`, error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating the provider'
    });
  }
}));

export default router;
