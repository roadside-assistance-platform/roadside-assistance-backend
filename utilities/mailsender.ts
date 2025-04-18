// utils/sendMail.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME!,
    pass: process.env.EMAIL_PASSWORD!,
  },
});

export const sendMail = async (
  from: string,
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<void> => {
  const mailOptions = {
    from,
    to,
    subject,
    text,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Email sent:', info.response);
};
