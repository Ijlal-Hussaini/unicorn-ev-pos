import dotenv from 'dotenv';
import { createTransport } from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('='.repeat(60));
console.log('Email Configuration Test');
console.log('='.repeat(60));
console.log('MAIL_USER:', process.env.MAIL_USER);
console.log('MAIL_PASS:', process.env.MAIL_PASS ? '****' + process.env.MAIL_PASS.slice(-4) : 'NOT SET');
console.log('='.repeat(60));

// Test with spaces removed (Gmail app passwords work both ways)
const passWithoutSpaces = process.env.MAIL_PASS.replace(/\s/g, '');

const transporter = createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: passWithoutSpaces,
  },
  debug: true, // Enable debug output
  logger: true  // Log to console
});

// Verify connection
console.log('\nVerifying SMTP connection...\n');
transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ SMTP Connection Failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Command:', error.command);
    console.error('\nPossible issues:');
    console.error('1. App password is incorrect');
    console.error('2. 2-Step Verification not enabled on Gmail');
    console.error('3. Network/firewall blocking Gmail SMTP');
    console.error('4. Gmail account security settings blocking access');
  } else {
    console.log('✅ SMTP Connection Successful!');
    console.log('\nSending test email...\n');
    
    // Send test email
    transporter.sendMail({
      from: `"UnicornEV Test" <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_USER, // Send to yourself
      subject: 'Test Email - UnicornEV POS',
      text: 'If you receive this email, your email configuration is working correctly!',
      html: '<h1>Success!</h1><p>Your email configuration is working correctly.</p>'
    }, (error, info) => {
      if (error) {
        console.error('❌ Failed to send email:');
        console.error('Error:', error.message);
      } else {
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);
        console.log('\nCheck your inbox:', process.env.MAIL_USER);
      }
      process.exit(error ? 1 : 0);
    });
  }
});
