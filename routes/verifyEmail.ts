/**
 * @swagger
 * tags:
 *   name: EmailVerification
 *   description: Endpoints for email verification
 */

/**
 * @swagger
 * /email/send-code:
 *   post:
 *     summary: Send a verification code to the user's email
 *     tags: [EmailVerification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email address to send the verification code to
 *     responses:
 *       200:
 *         description: Verification code sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Verification code sent
 *       400:
 *         description: Email is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Email is required
 *       500:
 *         description: Failed to send verification email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to send verification email
 */

/**
 * @swagger
 * /email/verify-code:
 *   post:
 *     summary: Verify the code sent to the user's email
 *     tags: [EmailVerification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email address to verify
 *               code:
 *                 type: string
 *                 description: The verification code sent to the email
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email verified successfully
 *       400:
 *         description: Email and code are required, or the code is invalid/expired
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid or expired verification code
 *       404:
 *         description: No verification record found for the email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: No verification record found
 */

import prisma from '../app';
import logger from '../utilities/logger';
import { sendMail } from '../utilities/mailsender';
import { Router } from "express";

const router = Router();

router.post('/send-code', async (req: any, res: any) => {
  const { email } = req.body as { email: string };

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Check if a provider or client exists with this email
    const [provider, client] = await Promise.all([
      prisma.provider.findUnique({
        where: { email, deleted: false },
        select: { id: true }
      }),
      prisma.client.findUnique({
        where: { email, deleted: false },
        select: { id: true }
      })
    ]);

    if (!provider && !client) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    // Generate a 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Save or update the verification code in the database
    await prisma.emailVerification.upsert({
      where: { email },
      update: { code, createdAt: new Date() },
      create: { email, code },
    });

    // Send the verification email
    await sendMail(
      process.env.EMAIL_USERNAME!,
      email,
      'Your Depan.Go Verification Code',
      `Depan.Go Email Verification
      
      Hello,
      
      Your verification code is: ${code}
      
      Please enter this code in the app to verify your email address.
      
      This code will expire in 15 minutes.
      
      If you didn't request this, please ignore this email.
      
      Thanks,
      The Depan.Go Team`,
      `<!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { color: #2563eb; font-size: 24px; margin-bottom: 20px; }
          .code { 
            font-size: 24px; 
            font-weight: bold; 
            letter-spacing: 2px; 
            color: #2563eb;
            margin: 20px 0;
            padding: 10px 20px;
            background-color: #f0f7ff;
            display: inline-block;
            border-radius: 4px;
          }
          .footer { 
            margin-top: 30px; 
            font-size: 14px; 
            color: #666; 
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">Depan.Go Email Verification</div>
          
          <p>Hello,</p>
          
          <p>Please use the following verification code to verify your email address:</p>
          
          <div class="code">${code}</div>
          
          <p>This code will expire in <strong>15 minutes</strong>.</p>
          
          <p>If you didn't request this, please ignore this email or contact support if you have any questions.</p>
          
          <div class="footer">
            <p>Thanks,<br>The Depan.Go Team</p>
            <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} Depan.Go. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>`
    );

    logger.info('Verification code sent');
    return res.status(200).json({ message: 'Verification code sent' });
  } catch (error) {
    logger.error('Failed to send verification code:', error);
    return res.status(500).json({ error: 'Failed to send verification email' });
  }
});

router.post('/verify-code', async (req: any, res: any) => {
  const { email, code } = req.body as { email: string; code: string };

  if (!('email' in req.body) || !('code' in req.body))
    return res.status(400).json({ error: 'Email and code are required' });

  const record = await prisma.emailVerification.findUnique({ where: { email } });

  if (!record) return res.status(404).json({ error: 'No verification record found' });

  const isCodeValid = record.code === code;
  const isRecent =
    new Date().getTime() - new Date(record.createdAt).getTime() < 10 * 60 * 1000;

  if (isCodeValid && isRecent) {
    await prisma.emailVerification.delete({ where: { email } });
    return res.status(200).json({ message: 'Email verified successfully' });
  }

  return res.status(400).json({ error: 'Invalid or expired verification code' });
});

export default router;
