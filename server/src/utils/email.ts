// utils/email.ts
import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter;

export const initializeEmailTransporter = () => {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendPasswordResetEmail = async (to: string, resetToken: string, username: string) => {
  if (!transporter) {
    initializeEmailTransporter();
  }

  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@ministack.com',
    to,
    subject: 'Password Reset Request',
    html: `
      <h1>Hello ${username},</h1>
      <p>You have requested to reset your password.</p>
      <p>Please click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request this reset, please ignore this email.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

export const sendNewAnswerNotification = async (
  to: string, 
  username: string,
  questionTitle: string,
  answererName: string,
  questionId: string
) => {
  if (!transporter) {
    initializeEmailTransporter();
  }

  const questionUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/questions/${questionId}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@ministack.com',
    to,
    subject: `New Answer to Your Question: ${questionTitle}`,
    html: `
      <h1>Hello ${username},</h1>
      <p>Good news! ${answererName} has posted an answer to your question:</p>
      <h2>"${questionTitle}"</h2>
      <p>Click the link below to view the answer:</p>
      <a href="${questionUrl}">${questionUrl}</a>
      <br>
      <p>Thank you for being part of our community!</p>
    `
  };

  await transporter.sendMail(mailOptions);
};
