// emailUtils.ts
import nodemailer from 'nodemailer';
import { Transporter, SendMailOptions, SentMessageInfo } from 'nodemailer';
import { Attachment } from 'nodemailer/lib/mailer';


interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  cc?: string;
  bcc?: string;
  attachments?: Attachment[];
}


interface EmailResult {
  success: boolean;
  messageId: string;
  response: string;
}

/**
 * Configure the email transport with SMTP settings
 */
const createTransporter = (): Transporter => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

/**
 * Send an email using nodemailer
 * 
 * @param options - Email options
 * @returns Promise resolving with information about the sent email
 * @throws Error if required fields are missing or if sending fails
 */
const sendEmail = async (options: EmailOptions): Promise<EmailResult> => {
  try {
    // Validate required fields
    if (!options.to) {
      throw new Error('Recipient email (to) is required');
    }
    
    if (!options.subject) {
      throw new Error('Email subject is required');
    }
    
    if (!options.text && !options.html) {
      throw new Error('Email body (text or html) is required');
    }
    
    // Create transporter instance
    const transporter = createTransporter();
    
    // Set default sender if not provided
    const from = options.from || process.env.DEFAULT_EMAIL_FROM || 'noreply@yourdomain.com';
    
    // Configure email data
    const mailOptions: SendMailOptions = {
      from,
      to: options.to,
      subject: options.subject,
      cc: options.cc,
      bcc: options.bcc,
    };
    
    // Only add text or html properties if they are provided
    if (options.text) mailOptions.text = options.text;
    if (options.html) mailOptions.html = options.html;
    if (options.attachments) mailOptions.attachments = options.attachments;
    
    // Send the email
    const info: SentMessageInfo = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export {
  sendEmail,
  type EmailOptions,
  type EmailResult
};
