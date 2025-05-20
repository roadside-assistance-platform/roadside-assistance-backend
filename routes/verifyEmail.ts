import { Router } from "express";
import prisma from '../app';
import logger from '../utilities/logger';
import { sendMail } from '../utilities/mailsender';

const router = Router();

/**
 * @swagger
 * /send-code:
 *   post:
 *     summary: Send a verification code (no verification required)
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
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification code sent successfully
 *       400:
 *         description: Email is required
 */
router.post('/send-code', async (req: any, res: any) => {
  const { email } = req.body as { email: string };

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Generate a simple 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save the verification code to the database
    await prisma.verificationCode.create({
      data: {
        email,
        code,
      },
    });
    
    // Log the code for testing purposes
    logger.info(`Verification code for ${email}: ${code}`);

    // Send the email with the code using the same template as forgot-code
    await sendMail(
      process.env.EMAIL_USERNAME!, // from
      email, // to
      'Your Verification Code',
      `Your verification code is: ${code}`,
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
          <div class="header">Your Verification Code</div>
          <p>Please use the following verification code to verify your email address:</p>
          <div class="code">${code}</div>
          <p>This code will expire in <strong>15 minutes</strong>.</p>
          <p>If you didn't request this, please ignore this email or contact support if you have any questions.</p>
          <div class="footer">
            <p>Thanks,<br>Depan.Go Team</p>
          </div>
        </div>
      </body>
      </html>`
    );

    logger.info('Verification code sent');
    return res.status(200).json({ message: 'Verification code sent' });
  } catch (error) {
    logger.error('Failed to send verification code:', error);
    return res.status(500).json({ error: 'Failed to send verification code' });
  }
});

/**
 * @swagger
 * /forgot-code:
 *   post:
 *     summary: Send a verification code (verifies email exists first)
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
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification code sent successfully
 *       400:
 *         description: Email is required
 *       404:
 *         description: No account found with this email
 */
router.post('/forgot-code', async (req: any, res: any) => {
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

    // Generate a simple 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save the verification code to the database
    await prisma.verificationCode.create({
      data: {
        email,
        code,
      },
    });
    
    // Log the code for testing purposes
    logger.info(`Verification code for ${email}: ${code}`);

    // Send the email with the code using the same template as send-code
    await sendMail(
      process.env.EMAIL_USERNAME!, // from
      email, // to
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
          <div class="header">Your Verification Code</div>
          <p>Please use the following verification code to verify your email address:</p>
          <div class="code">${code}</div>
          <p>This code will expire in <strong>15 minutes</strong>.</p>
          <p>If you didn't request this, please ignore this email or contact support if you have any questions.</p>
          <div class="footer">
            <p>Thanks,<br>Depan.Go Team</p>
          </div>
        </div>
      </body>
      </html>`
    );

    logger.info('Verification code sent');
    return res.status(200).json({ message: 'Verification code sent' });
  } catch (error) {
    logger.error('Failed to send verification code:', error);
    return res.status(500).json({ error: 'Failed to send verification code' });
  }
});

/**
 * @swagger
 * /verify-code:
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
 *                 format: email
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Email and code are required
 *       404:
 *         description: No verification record found for this email
 *       410:
 *         description: Verification code has expired
 *       403:
 *         description: Invalid verification code
 */
router.post('/verify-code', async (req: any, res: any) => {
  const { email, code } = req.body as { email: string; code: string };

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required' });
  }

  try {
    // Find the verification record
    const verification = await prisma.verificationCode.findFirst({
      where: { email, code },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      return res.status(404).json({ error: 'No verification record found for this email' });
    }

    // Check if code is expired (15 minutes)
    const expirationTime = 15 * 60 * 1000; // 15 minutes in milliseconds
    const isExpired = new Date().getTime() - verification.createdAt.getTime() > expirationTime;
    
    if (isExpired) {
      // Delete the expired verification code
      await prisma.verificationCode.delete({
        where: { id: verification.id }
      });
      return res.status(410).json({ error: 'Verification code has expired' });
    }

    // Mark the verification code as used
    await prisma.verificationCode.update({
      where: { id: verification.id },
      data: { 
        used: true,
        updatedAt: new Date()
      }
    });

    return res.status(200).json({ 
      message: 'Email verified successfully',
      email: verification.email
    });
  } catch (error) {
    logger.error('Failed to verify code:', error);
    return res.status(500).json({ error: 'Failed to verify code' });
  }
});

export default router;
