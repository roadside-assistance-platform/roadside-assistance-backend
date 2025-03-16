import nodemailer from 'nodemailer';

// Configure the transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // e.g., 'gmail'
  auth: {
    user: process.env.EMAIL_USERNAME, // your email

    pass:process.env.EMAIL_PASSWORD, // your email password,
  },
});

// Define and export the sendMail function
export const sendMail = async (
  from: string,
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<void> => {
  try {
    const mailOptions = {
      from,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
