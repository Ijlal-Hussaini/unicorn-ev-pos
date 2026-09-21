import { createTransport } from 'nodemailer';
import logger from './logger.js';

// Create transporter
const createTransporter = () => {
  // Remove spaces from app password (Gmail accepts both formats)
  const cleanPassword = process.env.MAIL_PASS ? process.env.MAIL_PASS.replace(/\s/g, '') : '';
  
  const config = {
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: cleanPassword,
    },
    debug: false, // Set to true for debugging
  };
  
  console.log('Creating email transporter with user:', process.env.MAIL_USER);
  logger.info('Email configuration loaded', { 
    user: process.env.MAIL_USER ? 'Set' : 'NOT SET',
    pass: process.env.MAIL_PASS ? 'Set' : 'NOT SET'
  });
  
  return createTransport(config);
};

// Send OTP email
export const sendOTPEmail = async (email, otp, username) => {
  try {
    console.log('Attempting to send OTP email to:', email);
    const transporter = createTransporter();

    const mailOptions = {
      from: `"UnicornEV POS" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Password Reset OTP - UnicornEV POS',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .otp-box { background-color: white; border: 2px dashed #4F46E5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 5px; }
            .warning { color: #dc2626; font-size: 14px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${username}</strong>,</p>
              <p>We received a request to reset your password for your UnicornEV POS account.</p>
              <p>Use the following OTP (One-Time Password) to reset your password:</p>
              
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
              </div>
              
              <p><strong>This OTP is valid for 10 minutes.</strong></p>
              
              <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
              
              <div class="warning">
                ⚠️ Never share this OTP with anyone. Our team will never ask for your OTP.
              </div>
            </div>
            <div class="footer">
              <p>© 2026 UnicornEV POS. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully:', info.messageId);
    logger.info('OTP email sent', { to: email, messageId: info.messageId });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    logger.error('Failed to send OTP email', { 
      to: email, 
      error: error.message,
      code: error.code,
      command: error.command
    });
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};

// Send password reset success email
export const sendPasswordResetSuccessEmail = async (email, username) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"UnicornEV POS" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Password Reset Successful - UnicornEV POS',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Successful</h1>
            </div>
            <div class="content">
              <div class="success-icon">✅</div>
              <p>Hello <strong>${username}</strong>,</p>
              <p>Your password has been successfully reset.</p>
              <p>You can now log in to your UnicornEV POS account with your new password.</p>
              <p>If you didn't make this change, please contact support immediately.</p>
            </div>
            <div class="footer">
              <p>© 2026 UnicornEV POS. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset success email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset success email:', error);
    // Don't throw error here, as password is already reset
    return { success: false, error: error.message };
  }
};

// Send email change verification OTP
export const sendEmailChangeOTP = async (email, otp, username) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"UnicornEV POS" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Email Change Verification - UnicornEV POS',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .otp-box { background-color: white; border: 2px dashed #4F46E5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 5px; }
            .warning { color: #dc2626; font-size: 14px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Email Change Verification</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${username}</strong>,</p>
              <p>We received a request to change the email address for your UnicornEV POS account.</p>
              <p>Use the following OTP (One-Time Password) to verify your new email address:</p>
              
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
              </div>
              
              <p><strong>This OTP is valid for 10 minutes.</strong></p>
              
              <p>If you didn't request this change, please ignore this email or contact support if you have concerns.</p>
              
              <div class="warning">
                ⚠️ Never share this OTP with anyone. Our team will never ask for your OTP.
              </div>
            </div>
            <div class="footer">
              <p>© 2026 UnicornEV POS. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email change OTP sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email change OTP:', error);
    throw new Error('Failed to send verification email');
  }
};

// Send email change success notification
export const sendEmailChangeSuccessEmail = async (oldEmail, newEmail, username) => {
  try {
    const transporter = createTransporter();

    // Send to old email
    const oldEmailOptions = {
      from: `"UnicornEV POS" <${process.env.MAIL_USER}>`,
      to: oldEmail,
      subject: 'Email Address Changed - UnicornEV POS',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .warning { color: #dc2626; font-size: 14px; margin-top: 20px; padding: 15px; background-color: #fee2e2; border-radius: 5px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Email Address Changed</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${username}</strong>,</p>
              <p>This is to notify you that the email address for your UnicornEV POS account has been changed.</p>
              <p><strong>Old Email:</strong> ${oldEmail}</p>
              <p><strong>New Email:</strong> ${newEmail}</p>
              <p>All future communications will be sent to your new email address.</p>
              
              <div class="warning">
                <strong>⚠️ Important:</strong> If you didn't make this change, please contact support immediately as your account may be compromised.
              </div>
            </div>
            <div class="footer">
              <p>© 2026 UnicornEV POS. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    // Send to new email
    const newEmailOptions = {
      from: `"UnicornEV POS" <${process.env.MAIL_USER}>`,
      to: newEmail,
      subject: 'Welcome to Your New Email - UnicornEV POS',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Email Successfully Updated</h1>
            </div>
            <div class="content">
              <div class="success-icon">✅</div>
              <p>Hello <strong>${username}</strong>,</p>
              <p>Your email address has been successfully updated to <strong>${newEmail}</strong>.</p>
              <p>You can now use this email address to log in to your UnicornEV POS account.</p>
              <p>All future communications will be sent to this email address.</p>
            </div>
            <div class="footer">
              <p>© 2026 UnicornEV POS. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(oldEmailOptions);
    await transporter.sendMail(newEmailOptions);
    
    console.log('Email change success notifications sent');
    return { success: true };
  } catch (error) {
    console.error('Error sending email change success emails:', error);
    // Don't throw error here, as email is already changed
    return { success: false, error: error.message };
  }
};
