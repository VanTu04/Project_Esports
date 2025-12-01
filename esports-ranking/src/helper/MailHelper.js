import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

class MailHelper {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: false, // TLS với port 587
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
      console.log('Email sent:', info.response);
      return true;
    } catch (error) {
      console.error('Send mail error:', error);
      return false;
    }
  }

  // async sendOtpEmail(to, otp) {
  async sendOtpEmail(to, otp, type = 'reset') {
    let subject = 'Mã OTP';
    let html = '';

    if (type === 'reset') {
      subject = 'Mã OTP đặt lại mật khẩu';
      html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Đặt lại mật khẩu</h2>
          <p>Bạn vừa yêu cầu đặt lại mật khẩu. Mã OTP của bạn là:</p>
          <h3 style="color:#007bff;">${otp}</h3>
          <p>Mã này sẽ hết hạn sau 5 phút.</p>
          <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
        </div>
      `;
    } else if (type === '2fa_enable') {
      subject = 'Mã OTP bật xác thực 2 yếu tố (2FA)';
      html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Bật xác thực 2 yếu tố (2FA)</h2>
          <p>Bạn đang yêu cầu bật xác thực 2 yếu tố cho tài khoản của mình. Mã OTP của bạn là:</p>
          <h3 style="color:#007bff;">${otp}</h3>
          <p>Mã này chỉ có hiệu lực trong 5 phút. Nếu bạn không thực hiện hành động này, hãy bỏ qua email.</p>
        </div>
      `;
    } else if (type === '2fa_disable') {
      subject = 'Mã OTP tắt xác thực 2 yếu tố (2FA)';
      html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Tắt xác thực 2 yếu tố (2FA)</h2>
          <p>Bạn đang yêu cầu tắt xác thực 2 yếu tố cho tài khoản của mình. Mã OTP của bạn là:</p>
          <h3 style="color:#007bff;">${otp}</h3>
          <p>Mã này chỉ có hiệu lực trong 5 phút. Nếu bạn không thực hiện hành động này, hãy bỏ qua email.</p>
        </div>
      `;
    } else if (type === 'login') {
      subject = 'Mã OTP đăng nhập';
      html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Xác minh đăng nhập</h2>
          <p>Bạn (hoặc người khác) đã yêu cầu mã xác thực để đăng nhập vào tài khoản. Mã OTP của bạn là:</p>
          <h3 style="color:#007bff;">${otp}</h3>
          <p>Mã này có hiệu lực trong 5 phút. Nếu bạn không yêu cầu, vui lòng bỏ qua email hoặc đổi mật khẩu để bảo mật tài khoản.</p>
        </div>
      `;
    } else {
      subject = 'Mã OTP';
      html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <p>Mã OTP của bạn là:</p>
          <h3 style="color:#007bff;">${otp}</h3>
        </div>
      `;
    }

    return this.sendMail(to, subject, html);
  }
}

export default new MailHelper();
