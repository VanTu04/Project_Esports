import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import models from '../models/index.js';
import * as jwt_token from '../middlewares/jwt_token.js';
import * as MailHelper from '../helper/MailHelper.js';

export const register = async (data) => {

  if (!data.email || !data.username || !data.password || !data.full_name) {
    throw new Error('Thiếu thông tin bắt buộc: email, username, full_name, password');
  }

  // Kiểm tra trùng email
  const existingUser = await models.User.findOne({
    where: {
      email: data.email,
      status: 1,
      deleted: 0
    }
  });

  if (existingUser) {
    throw new Error('Email đã tồn tại, vui lòng dùng email khác.');
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const newUser = await models.User.create({
    email: data.email,
    username: data.username,
    full_name: data.full_name,
    password: hashedPassword,
    role: data.role ?? 1,
    status: 1,
    deleted: 0
  });

  return { user: {
    id: newUser.id,
    email: newUser.email,
    username: newUser.username,
    full_name: newUser.full_name,
    role: newUser.role,
    status: newUser.status,
    deleted: newUser.deleted,
  } };
};

export const createAccount = async (data, adminId) => {
  let t;
  try {
    t = await models.sequelize.transaction();
    const hashedPassword = await bcrypt.hash(data.password, 10);
    console.log("Data:", data);
    const newUser = await models.User.create({
      username: data.username,
      full_name: data.full_name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      status: 1,
      deleted: 0,
      created_by: adminId
    }, { transaction: t });

    const newTeam = await models.Team.create({
      name: data.team_name,
      leader_id: data.leader_id,
      status: 1,
      create_by: adminId
    }, { transaction: t });

    await t.commit();
    return true;

  } catch (error) {
    await t.rollback();
    console.error('createAccount error:', error);
    return false;
  }
};

export const login = async (data) => {
  if (!data.account || !data.password) {
    throw new Error('Thiếu thông tin đăng nhập!');
  }

  // Tìm user theo email hoặc username
  const user = await models.User.findOne({
    where: {
      [Op.or]: [
        { email: data.account },
        { username: data.account }
      ],
      status: 1,
      deleted: 0
    }
  });

  if (!user) {
    throw new Error('Tài khoản không tồn tại!');
  }

  // So sánh mật khẩu
  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) {
    throw new Error('Mật khẩu không đúng!');
  }

  const accessToken = jwt_token.signAccessToken(user);
  const refreshToken = jwt_token.signRefreshToken(user);

  return { accessToken, refreshToken };
};

export const sendOtp = async (email, otp) => {
  try {
    await MailHelper.sendOtpEmail(email, otp);
    return true;
  } catch (error) {
    console.error("Lỗi gửi mail:", error);
    throw new Error("Gửi email thất bại");
  }
}

export const forgetPassword = async (data) => {

}


const getByEmail = async (email) => {
  return models.User.findOne({ where: { email } });
};

const getByUsername = async (username) => {
  return models.User.findOne({ where: { username } });
};

export const update = async (id, data) => {
  return models.User.update(data, { where: { id } });
};

export const updateOTP = async (id, otp, expiresAt) => {
  return models.User.update(
    {
      otp,
      updated_date: new Date(),
      expires: expiresAt,
    },
    { where: { id } }
  );
};

export const checkExistEmail = async (email) => {
  const existUser = await getByEmail(email);
  console.log('existUser', existUser);
  if(existUser) {
    return true;
  }
  return false;
};

export const checkExistUsername = async (username) => {
  const existUser = await getByUsername(username);
  console.log('existUser', existUser);
  return !!existUser; // true nếu tồn tại, false nếu không
};