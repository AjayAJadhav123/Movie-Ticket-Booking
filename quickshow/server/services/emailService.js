import nodemailer from 'nodemailer';

/**
 * Email Service Utility
 * Supports multiple SMTP providers via environment configuration
 * 
 * Environment Variables:
 * - EMAIL_PROVIDER: 'gmail', 'smtp', 'resend' (default: 'gmail')
 * - SENDER_EMAIL: Email address to send from
 * - SMTP_PASS: Password/app password for Gmail
 * - SMTP_HOST: SMTP host for custom SMTP
 * - SMTP_PORT: SMTP port (default: 587)
 * - SMTP_USER: SMTP username (if different from sender email)
 * - SMTP_PASSWORD: SMTP password for custom SMTP
 */

let transporter = null;

export const initializeEmailService = () => {
  const emailProvider = process.env.EMAIL_PROVIDER || 'gmail';
  const senderEmail = process.env.SENDER_EMAIL;

  if (!senderEmail) {
    console.warn('⚠️ SENDER_EMAIL not configured. Email service will not work.');
    return null;
  }

  try {
    if (emailProvider === 'gmail') {
      if (!process.env.SMTP_PASS) {
        console.warn('⚠️ SMTP_PASS not configured for Gmail. Email service will not work.');
        return null;
      }

      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: senderEmail,
          pass: process.env.SMTP_PASS,
        },
      });

      console.log('✅ Email service initialized: Gmail SMTP');
    } else if (emailProvider === 'smtp') {
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT || 587;
      const smtpUser = process.env.SMTP_USER || senderEmail;
      const smtpPassword = process.env.SMTP_PASSWORD;

      if (!smtpHost || !smtpPassword) {
        console.warn(
          '⚠️ SMTP_HOST and SMTP_PASSWORD required for custom SMTP. Email service will not work.'
        );
        return null;
      }

      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });

      console.log(`✅ Email service initialized: Custom SMTP (${smtpHost}:${smtpPort})`);
    } else if (emailProvider === 'resend') {
      const resendApiKey = process.env.RESEND_API_KEY;

      if (!resendApiKey) {
        console.warn('⚠️ RESEND_API_KEY not configured. Email service will not work.');
        return null;
      }

      // Resend uses nodemailer-resend transport
      transporter = nodemailer.createTransport({
        host: 'smtp.resend.dev',
        port: 465,
        secure: true,
        auth: {
          user: 'resend',
          pass: resendApiKey,
        },
      });

      console.log('✅ Email service initialized: Resend');
    } else {
      console.warn(`⚠️ Unknown email provider: ${emailProvider}`);
      return null;
    }

    return transporter;
  } catch (error) {
    console.error('Error initializing email service:', error.message);
    return null;
  }
};

export const getEmailTransporter = () => {
  if (!transporter) {
    transporter = initializeEmailService();
  }
  return transporter;
};

export const isEmailConfigured = () => {
  const transporter = getEmailTransporter();
  return transporter !== null;
};

export const testEmailConnection = async () => {
  try {
    const transporter = getEmailTransporter();
    if (!transporter) {
      return { success: false, message: 'Email service not configured' };
    }

    await transporter.verify();
    return { success: true, message: 'Email connection verified' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const sendEmail = async (to, subject, html, options = {}) => {
  try {
    const transporter = getEmailTransporter();
    if (!transporter) {
      console.error('Email service not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const senderEmail = process.env.SENDER_EMAIL;
    const from = options.from || `QuickShow <${senderEmail}>`;

    const mailOptions = {
      from,
      to,
      subject,
      html,
      ...options,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error.message);
    return { success: false, };
  }
};

export default {
  initializeEmailService,
  getEmailTransporter,
  isEmailConfigured,
  testEmailConnection,
  sendEmail,
};
