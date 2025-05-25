/**
 * @swagger
 * /client/update/{id}:
 *   put:
 *     summary: Update an existing client
 *     tags:
 *       - Client
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The client ID
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
 *               deleted:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Client updated successfully
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
 *                   example: "Client updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     client:
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
 *                         deleted:
 *                           type: boolean
 *                         createdAt:
 *                           type: string
 *                         updatedAt:
 *                           type: string
 *       400:
 *         description: Bad request, invalid client ID or no fields provided for update
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Client ID is required"
 *       404:
 *         description: Client not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Client not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "An error occurred while updating the client"
 */

import prisma from "../../app";
import { hashPassword } from "../../utilities/bcrypt";
import { Router, Request, Response } from "express";
import logger from "../../utilities/logger";
import { catchAsync } from '../../utilities/catchAsync';

const router = Router();

router.put("/:id", catchAsync(async (req: any, res: any) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!id) {
    logger.error("Client ID is required");
    return res.status(400).json({
      status: 'error',
      message: 'Client ID is required'
    });
  }

  try {
    const existingUser = await prisma.client.findUnique({ 
      where: { id },
      select: {
        id: true,
        email: true,
        deleted: true
      }
    });
    
    if (!existingUser) {
      logger.error("Client not found");
      return res.status(404).json({
        status: 'error',
        message: 'Client not found'
      });
    }

    if (Object.keys(updateData).length === 0) {
      logger.error("No fields provided for update");
      return res.status(400).json({
        status: 'error',
        message: 'No fields provided for update'
      });
    }

    // Hash password if provided
    if (updateData.password) {
      updateData.password = await hashPassword(updateData.password);
    }

    // Prepare update data
    const dataToUpdate = { ...updateData };

    const updatedUser = await prisma.client.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        photo: true,
        deleted: true,
        createdAt: true,
        updatedAt: true
      }
    });

    logger.info(`Client updated successfully: ${id}`);
    
    return res.status(200).json({
      status: 'success',
      message: 'Client updated successfully',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    logger.error(`Error updating client:`, error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating the client'
    });
  }
}));

export default router;
