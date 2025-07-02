const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Email templates
const emailTemplates = {
  emailVerification: (data) => ({
    subject: 'Verify Your Email - IELTS Exam Simulator',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>IELTS Exam Simulator</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.name}!</h2>
            <p>Thank you for registering with IELTS Exam Simulator. To complete your registration, please verify your email address by clicking the button below:</p>
            <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p>${data.verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account with us, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 IELTS Exam Simulator. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  passwordReset: (data) => ({
    subject: 'Reset Your Password - IELTS Exam Simulator',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.name}!</h2>
            <p>We received a request to reset your password for your IELTS Exam Simulator account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${data.resetUrl}" class="button">Reset Password</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p>${data.resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 IELTS Exam Simulator. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  examReminder: (data) => ({
    subject: 'Exam Reminder - IELTS Exam Simulator',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Exam Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Exam Reminder</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.name}!</h2>
            <p>This is a friendly reminder that you have an upcoming IELTS exam scheduled.</p>
            <p><strong>Exam:</strong> ${data.examTitle}</p>
            <p><strong>Date:</strong> ${data.examDate}</p>
            <p><strong>Time:</strong> ${data.examTime}</p>
            <p>Please make sure you have:</p>
            <ul>
              <li>A stable internet connection</li>
              <li>A quiet environment</li>
              <li>Headphones for the listening section</li>
              <li>All necessary materials ready</li>
            </ul>
            <a href="${data.examUrl}" class="button">Start Exam</a>
          </div>
          <div class="footer">
            <p>&copy; 2024 IELTS Exam Simulator. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  examResults: (data) => ({
    subject: 'Your Exam Results - IELTS Exam Simulator',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Exam Results</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #7c3aed; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .score { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #7c3aed; }
          .button { display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Exam Results</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.name}!</h2>
            <p>Your IELTS exam results are ready. Here's your performance breakdown:</p>
            
            <div class="score">
              <strong>Overall Band Score:</strong> ${data.overallScore}
            </div>
            
            <div class="score">
              <strong>Listening:</strong> ${data.listeningScore}
            </div>
            
            <div class="score">
              <strong>Reading:</strong> ${data.readingScore}
            </div>
            
            <div class="score">
              <strong>Writing:</strong> ${data.writingScore}
            </div>
            
            <div class="score">
              <strong>Speaking:</strong> ${data.speakingScore}
            </div>
            
            <p>Click the button below to view detailed feedback and recommendations:</p>
            <a href="${data.resultsUrl}" class="button">View Detailed Results</a>
          </div>
          <div class="footer">
            <p>&copy; 2024 IELTS Exam Simulator. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  referralBonus: (data) => ({
    subject: 'Referral Bonus Earned - IELTS Exam Simulator',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Referral Bonus</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .bonus { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #f59e0b; text-align: center; }
          .button { display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Referral Bonus Earned!</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.name}!</h2>
            <p>Congratulations! You've earned a referral bonus because someone signed up using your referral link.</p>
            
            <div class="bonus">
              <h3>Bonus Amount: $${data.bonusAmount}</h3>
              <p>This has been added to your wallet balance.</p>
            </div>
            
            <p><strong>Referred User:</strong> ${data.referredUser}</p>
            <p><strong>Current Wallet Balance:</strong> $${data.walletBalance}</p>
            
            <p>Keep sharing your referral link to earn more bonuses!</p>
            <a href="${data.dashboardUrl}" class="button">View Dashboard</a>
          </div>
          <div class="footer">
            <p>&copy; 2024 IELTS Exam Simulator. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  supportTicketUpdate: (data) => ({
    subject: 'Support Ticket Update - IELTS Exam Simulator',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Support Ticket Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0891b2; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .ticket { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #0891b2; }
          .button { display: inline-block; padding: 12px 24px; background: #0891b2; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Support Ticket Update</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.name}!</h2>
            <p>Your support ticket has been updated.</p>
            
            <div class="ticket">
              <p><strong>Ticket ID:</strong> ${data.ticketId}</p>
              <p><strong>Subject:</strong> ${data.subject}</p>
              <p><strong>Status:</strong> ${data.status}</p>
              <p><strong>Update:</strong> ${data.message}</p>
            </div>
            
            <a href="${data.ticketUrl}" class="button">View Ticket</a>
          </div>
          <div class="footer">
            <p>&copy; 2024 IELTS Exam Simulator. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Send email function
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    // Get template if specified
    let emailContent = {};
    if (options.template && emailTemplates[options.template]) {
      emailContent = emailTemplates[options.template](options.data || {});
    } else {
      emailContent = {
        subject: options.subject,
        html: options.html || options.text
      };
    }

    const mailOptions = {
      from: `"IELTS Exam Simulator" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: options.text || emailContent.text
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', info.messageId);
    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send email');
  }
};

// Send bulk emails
const sendBulkEmail = async (recipients, options) => {
  try {
    const transporter = createTransporter();
    const results = [];

    for (const recipient of recipients) {
      try {
        const mailOptions = {
          from: `"IELTS Exam Simulator" <${process.env.SMTP_USER}>`,
          to: recipient.email,
          subject: options.subject,
          html: options.html,
          text: options.text
        };

        const info = await transporter.sendMail(mailOptions);
        results.push({
          email: recipient.email,
          success: true,
          messageId: info.messageId
        });

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        results.push({
          email: recipient.email,
          success: false,
          error: error.message
        });
      }
    }

    return results;

  } catch (error) {
    console.error('Bulk email sending error:', error);
    throw new Error('Failed to send bulk emails');
  }
};

// Verify email configuration
const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendBulkEmail,
  verifyEmailConfig,
  emailTemplates
}; 