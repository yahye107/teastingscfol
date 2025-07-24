// utils/emailService.js
require("dotenv").config();
const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");

const mail = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY });

const sendCredentialsEmail = async (to, username, password) => {
  const from = new Sender(process.env.EMAIL_FROM, "Your App Name");
  const toList = [new Recipient(to)];

  const params = new EmailParams()
    .setFrom(from)
    .setTo(toList)
    .setSubject("Your Account Credentials")
    .setHtml(
      `
      <p>Hello,</p>
      <p>Here are your login details:</p>
      <ul>
         <li><strong>Username:</strong> ${username}</li>
         <li><strong>Password:</strong> ${password}</li>
      </ul>
      <p>Please change your password after logging in.</p>
    `
    )
    .setText(`Username: ${username}\nPassword: ${password}`);

  try {
    const res = await mail.email.send(params);
    console.log("MailerSend email sent:", res);
  } catch (err) {
    console.error("MailerSend error:", err);
    throw err;
  }
};
module.exports = { sendCredentialsEmail };
