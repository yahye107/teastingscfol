const nodemailer = require("nodemailer");
require("dotenv").config();

const sendCredentialsEmail = async (email, username, password) => {
  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io", // or smtp.mailtrap.io
    port: 2525,
    auth: {
      user: "YOUR_MAILTRAP_USERNAME", // replace with real credentials
      pass: "YOUR_MAILTRAP_PASSWORD",
    },
  });

  async function sendEmail() {
    try {
      const info = await transporter.sendMail({
        from: '"My App" <no-reply@myapp.com>',
        to: "example@example.com",
        subject: "Test Email from Mailtrap",
        text: "Hello, this is a test email sent using Mailtrap and Nodemailer.",
      });

      console.log("✅ Email sent:", info.messageId);
    } catch (error) {
      console.error("❌ Email failed to send:", error.message);
    }
  }

  sendEmail();
};

module.exports = { sendCredentialsEmail };
