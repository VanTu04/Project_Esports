// const nodemailer = require('nodemailer');

// exports.sendMailVerifyByOTP = async (host, toEmail, otp) => {
//   const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASS
//     }
//   });

//   const mailOptions = {
//     from: process.env.SMTP_USER,
//     to: toEmail,
//     subject: 'Xác thực tài khoản eSports Ranking',
//     html: `
//       <h2>Mã OTP xác thực</h2>
//       <p>Mã OTP của bạn là: <b>${otp}</b></p>
//       <p>Mã này sẽ hết hạn sau 5 phút.</p>
//     `
//   };

//   await transporter.sendMail(mailOptions);
// };