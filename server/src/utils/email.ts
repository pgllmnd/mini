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

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@ministack.com',
    to,
    subject: 'Code de réinitialisation de mot de passe',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Bonjour ${username},</h1>
        
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        
        <p>Voici votre code de réinitialisation :</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="font-family: monospace; font-size: 18px; font-weight: bold; text-align: center; margin: 0;">
            ${resetToken}
          </p>
        </div>

        <div style="margin: 20px 0;">
          <p><strong>Pour réinitialiser votre mot de passe :</strong></p>
          <ol style="line-height: 1.6;">
            <li>Allez sur <a href="${clientUrl}/reset-password" style="color: #2563eb;">la page de réinitialisation</a></li>
            <li>Collez le code ci-dessus dans le champ prévu à cet effet</li>
            <li>Saisissez votre nouveau mot de passe</li>
          </ol>
        </div>

        <p style="background-color: #fef2f2; color: #991b1b; padding: 10px; border-radius: 4px;">
          ⚠️ Ce code expirera dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.
        </p>
      </div>
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
