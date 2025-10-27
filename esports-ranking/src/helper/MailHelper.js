const nodemailer = require('nodemailer');
require('dotenv').config();

class MailHelper {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: false, // dùng TLS với port 587
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendMail(to, subject, htmlContent) {
    try {
      const mailOptions = {
        from: process.env.MAIL_FROM,
        to,
        subject,
        html: htmlContent,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Email sent:", info.response);
      return true;
    } catch (error) {
      console.error("Send mail error:", error);
      return false;
    }
  }

  async sendOtpEmail(to, otp) {
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Quên mật khẩu</h2>
        <p>Bạn vừa yêu cầu đặt lại mật khẩu. Mã OTP của bạn là:</p>
        <h3 style="color:#007bff;">${otp}</h3>
        <p>Mã này sẽ hết hạn sau 5 phút.</p>
        <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
      </div>
    `;
    return this.sendMail(to, "Mã OTP đặt lại mật khẩu", html);
  }

}

module.exports = new MailHelper();