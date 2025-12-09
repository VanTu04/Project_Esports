import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import models from '../models/index.js';
import * as jwt_token from '../middlewares/jwt_token.js';
import MailHelper from '../helper/MailHelper.js';
import { decrypt, generateWallet } from '../utils/wallet.js';
import { fundWalletOnAnvil } from '../init/initAdmin.js';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import crypto from 'crypto';

export const register = async (data) => {
  if (!data.email || !data.username || !data.password || !data.full_name) {
    throw new Error('Thiếu thông tin bắt buộc: email, username, full_name, password');
  }

  const existingUser = await models.User.findOne({
    where: { email: data.email, status: 1, deleted: 0 }
  });

  if (existingUser) {
    throw new Error('Email đã tồn tại, vui lòng dùng email khác.');
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const wallet = generateWallet();

  const newUser = await models.User.create({
    email: data.email,
    username: data.username,
    full_name: data.full_name,
    password: hashedPassword,
    role: data.role ?? 1,
    status: 1,
    deleted: 0,
    wallet_address: wallet.address,
    private_key: wallet.privateKey 
  });

  // --- 4. TỰ ĐỘNG NẠP 100 ETH BẰNG HÀM HELPER ---
  await fundWalletOnAnvil(wallet.address, "100"); 

  // Trả về thông tin user
  return {
    user: {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      full_name: newUser.full_name,
      role: newUser.role,
      wallet_address: newUser.wallet_address
    }
  };
};

export const createAccount = async (data, adminId) => {
  let t;
  try {
    t = await models.sequelize.transaction();

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // 1. TẠO VÍ
    // wallet.privateKey ở đây LÀ KEY ĐÃ ĐƯỢC MÃ HÓA
    const wallet = generateWallet(); 
    console.log("Wallet generated:", wallet.address);

    // 2. TẠO USER (SỬA LẠI)
    const newUser = await models.User.create({
      username: data.username,
      full_name: data.full_name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      status: 1,
      deleted: 0,
      wallet_address: wallet.address,
      private_key: wallet.privateKey, // <-- SỬA Ở ĐÂY: Dùng trực tiếp
      created_by: adminId
    }, { transaction: t });

    let newTeam = null;
    if (data.team_name) {
      newTeam = await models.Team.create({
        name: data.team_name,
        leader_id: newUser.id,
        status: 1,
        create_by: adminId
      }, { transaction: t });
    }

    await t.commit();

    // 3. NẠP TIỀN VÀO NODE
    await fundWalletOnAnvil(wallet.address, "100");

    console.log("Create account successful");
    return { success: true };

  } catch (error) {
    if (t) await t.rollback();
    console.error('createAccount error:', error);
    return { success: false, error: error.message };
  }
};

export const getProfile = async (userId) => {
  let user = await models.User.findOne({
    where: { id: userId, status: 1, deleted: 0 },
    attributes: ['id', 'username', 'full_name', 'email', 'role', 'wallet_address', 'private_key', 'avatar', 'phone', 'two_factor_enabled', 'email_two_factor_enabled', 'totp_secret']
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Calculate total rewards received from TransactionHistory
  const totalRewards = await models.TransactionHistory.sum('amount', {
    where: {
      user_id: userId,
      type: ['REWARD', 'RECEIVE_REWARD'],
      status: 'SUCCESS'
    }
  }) || 0;

  console.log(`[UserService] Total rewards for user ${userId}:`, totalRewards);

  // Return relative path for avatar, let frontend handle full URL construction with CORS-enabled domain
  user = {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    avatar: user.avatar || null, // Return relative path like /uploads/xxx.png
    phone: user.phone,
    email: user.email,
    role: user.role,
    wallet_address: user.wallet_address,
    private_key: decrypt(user.private_key),
    two_factor_enabled: user.two_factor_enabled,
    email_two_factor_enabled: user.email_two_factor_enabled,
    totp_secret: !!user.totp_secret,
    total_rewards: totalRewards
  }

  console.log("[UserService] User profile with total_rewards:", user);

  return user;
};

export const getWalletFromDB = async (username) => {
  const existUser = await models.User.findOne({ where: { username: username } });
  if (!existUser) throw new Error("User not found in DB");
  
  return {
    address: existUser.wallet_address,
    privateKey: decrypt(existUser.private_key)
  };
};

export const getAllTeamWallets = async () => {
  const accTeams = await models.User.findAll({
    where: { role: 3 },
    attributes: ['username', 'wallet_address', 'private_key']
  });
  
  return accTeams.map(t => ({
    username: t.username,
    address: t.wallet_address,
    privateKey: decrypt(t.private_key)
  }));
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
  // If user has two-factor enabled, trigger OTP flow instead of returning tokens
  if (user.two_factor_enabled === 1) {
    // If user has TOTP configured, prefer TOTP as primary method
    if (user.totp_secret) {
      return {
        twoFactorRequired: true,
        method: 'totp',
        // include info for frontend: whether email-based 2FA is also enabled and the user's email
        email: user.email,
        email_two_factor_enabled: user.email_two_factor_enabled,
        totp: true
      };
    }

    // Fallback to email OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    await updateOTP(user.id, otp, expiresAt);
    await sendOtp(user.email, otp, 'login');

    return {
      twoFactorRequired: true,
      method: 'email',
      email: user.email
    };
  }

  const accessToken = jwt_token.signAccessToken(user);
  const refreshToken = jwt_token.signRefreshToken(user);

  let teamInfo = null;
  if (user.role === 3) {
    const team = await models.Team.findOne({
      where: { leader_id: user.id },
      attributes: ["id", "name", "wallet_address", "private_key"]
    });
    if (team) {
      teamInfo = team;
    }
  }

  const userInfo = {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    team: teamInfo
  };

  return {
    accessToken,
    refreshToken,
    userInfo
  };
};

export const loginConfirm = async (account, otp) => {
  if (!account || !otp) throw new Error('Thiếu thông tin xác thực 2FA');

  const user = await models.User.findOne({
    where: {
      [Op.or]: [ { email: account }, { username: account } ],
      status: 1,
      deleted: 0
    }
  });

  if (!user) throw new Error('Tài khoản không tồn tại');

  if (!user.otp || String(user.otp) !== String(otp)) throw new Error('OTP không hợp lệ');
  const now = new Date();
  if (!user.expires || user.expires < now) throw new Error('OTP đã hết hạn');

  // clear otp and enable login
  await updateOTP(user.id, null, null);

  const accessToken = jwt_token.signAccessToken(user);
  const refreshToken = jwt_token.signRefreshToken(user);

  let teamInfo = null;
  if (user.role === 3) {
    const team = await models.Team.findOne({
      where: { leader_id: user.id },
      attributes: ["id", "name", "wallet_address", "private_key"]
    });
    if (team) {
      teamInfo = team;
    }
  }

  const userInfo = {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    team: teamInfo
  };

  return {
    accessToken,
    refreshToken,
    userInfo
  };
};

export const refreshToken = async (user) => {
  const accessToken = jwt_token.signAccessToken(user);
  const refreshToken = jwt_token.signRefreshToken(user);
  return { accessToken, refreshToken };
};

export const sendOtp = async (email, otp, type = 'reset') => {
  // Ensure mail-sending failures are surfaced as exceptions so controllers
  // can return proper error responses to the client.
  const ok = await MailHelper.sendOtpEmail(email, otp, type);
  if (!ok) {
    console.error(`MailHelper failed to send OTP to ${email}`);
    throw new Error('Gửi email thất bại');
  }
  return true;
}

export const verifyUserPassword = async (userId, password) => {
  const user = await models.User.findByPk(userId);
  if (!user) throw new Error('User not found');
  const isMatch = await bcrypt.compare(String(password), user.password);
  if (!isMatch) throw new Error('Mật khẩu không đúng');
  return true;
};

export const forgetPassword = async (data) => {

}

export const getByEmail = async (email) => {
  return models.User.findOne({ where: { email } });
};

export const getByUsername = async (username) => {
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

// Get all users (Admin only)
export const getAllUsers = async (params = {}) => {
  try {
    const where = {
      deleted: 0
    };

    // Filter by status if provided
    if (params.status !== undefined) {
      where.status = params.status;
    }

    // Filter by role if provided
    if (params.role !== undefined) {
      where.role = params.role;
    }

    // Search by username, email, or full_name
    if (params.search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${params.search}%` } },
        { email: { [Op.like]: `%${params.search}%` } },
        { full_name: { [Op.like]: `%${params.search}%` } }
      ];
    }

    const users = await models.User.findAll({
      where,
      attributes: ['id', 'username', 'full_name', 'email', 'role', 'status', 'wallet_address', 'created_date', 'updated_date'],
      order: [['created_date', 'DESC']]
    });

    return users;
  } catch (error) {
    console.error('getAllUsers error:', error);
    throw error;
  }
};

// Update user (Admin only)
export const updateUser = async (userId, data, adminId) => {
  try {
    const user = await models.User.findOne({
      where: { id: userId, deleted: 0 }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updateData = {
      updated_date: new Date(),
      updated_by: adminId
    };

    // Only update allowed fields
    if (data.full_name !== undefined) updateData.full_name = data.full_name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.status !== undefined) updateData.status = data.status;

    // If password is being changed, hash it
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    await models.User.update(updateData, {
      where: { id: userId }
    });

    return { success: true };
  } catch (error) {
    console.error('updateUser error:', error);
    throw error;
  }
};

// Delete user (soft delete, Admin only)
export const deleteUser = async (userId, adminId) => {
  try {
    const user = await models.User.findOne({
      where: { id: userId, deleted: 0 }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Don't allow deleting yourself
    if (userId === adminId) {
      throw new Error('Cannot delete yourself');
    }

    await models.User.update({
      deleted: 1,
      deleted_date: new Date(),
      deleted_by: adminId
    }, {
      where: { id: userId }
    });

    return { success: true };
  } catch (error) {
    console.error('deleteUser error:', error);
    throw error;
  }
};

export const updateProfile = async (userId, { full_name, phone, avatar, description }) => {
  const user = await models.User.findByPk(userId);

  if (!user) throw new Error("User không tồn tại");

  
  const updateData = {
    full_name,
    phone,
    avatar: avatar ? `${avatar}` : user.avatar
  };
  
  if (description !== undefined) {
    updateData.description = description;
  }
  
  await user.update(updateData);


  return true;
};

export const findUsersByIds = async (userIds) => {
  return await models.User.findAll({
    where: {
      id: {
        [Op.in]: userIds
      }
    }
  });
};

// Start enable 2FA by sending OTP to user's email
export const startTwoFactorEnable = async (userId, password) => {
  // require password to start enabling email 2FA
  if (!password) throw new Error('Mật khẩu không được để trống');
  await verifyUserPassword(userId, password);
  const user = await models.User.findByPk(userId);
  if (!user) throw new Error('User not found');

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5);

  await updateOTP(userId, otp, expiresAt);
  await sendOtp(user.email, otp, '2fa_enable');
  return { success: true };
};

export const confirmTwoFactorEnable = async (userId, otp) => {
  const user = await models.User.findByPk(userId);
  if (!user) throw new Error('User not found');
  if (!user.otp || String(user.otp) !== String(otp)) throw new Error('OTP không hợp lệ');
  const now = new Date();
  if (!user.expires || user.expires < now) throw new Error('OTP đã hết hạn');

  await models.User.update({ two_factor_enabled: 1, email_two_factor_enabled: 1, otp: null, expires: null, updated_date: new Date() }, { where: { id: userId } });
  return { success: true };
};

// Start disable 2FA by sending OTP to user's email
export const startTwoFactorDisable = async (userId, password) => {
  // verify password first
  await verifyUserPassword(userId, password);
  const user = await models.User.findByPk(userId);
  if (!user) throw new Error('User not found');

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5);

  await updateOTP(userId, otp, expiresAt);
  await sendOtp(user.email, otp, '2fa_disable');
  return { success: true };
};

export const confirmTwoFactorDisable = async (userId, otp) => {
  const user = await models.User.findByPk(userId);
  if (!user) throw new Error('User not found');
  if (!user.otp || String(user.otp) !== String(otp)) throw new Error('OTP không hợp lệ');
  const now = new Date();
  if (!user.expires || user.expires < now) throw new Error('OTP đã hết hạn');

  await models.User.update({ two_factor_enabled: 0, email_two_factor_enabled: 0, otp: null, expires: null, updated_date: new Date() }, { where: { id: userId } });
  return { success: true };
};

// Immediate disable of all two-factor methods by verifying current password
export const disableTwoFactorByPassword = async (userId, password) => {
  // verify password first
  await verifyUserPassword(userId, password);
  const user = await models.User.findByPk(userId);
  if (!user) throw new Error('User not found');

  await models.User.update({
    totp_secret: null,
    totp_temp_secret: null,
    otp: null,
    expires: null,
    two_factor_enabled: 0,
    email_two_factor_enabled: 0,
    updated_date: new Date()
  }, { where: { id: userId } });

  return { success: true };
};

// Disable ALL two-factor methods when provided password and a valid token (TOTP or Email OTP)
export const disableAllTwoFactor = async (userId, { password, token }) => {
  if (!password) throw new Error('Mật khẩu không được để trống');
  await verifyUserPassword(userId, password);

  const user = await models.User.findByPk(userId);
  if (!user) throw new Error('User not found');

  // If token is provided, validate it against TOTP secret or OTP in DB
  let tokenOk = false;
  if (token) {
    if (user.totp_secret) {
      const secret = decryptSecret(user.totp_secret);
      tokenOk = speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 });
    }
    // check email OTP fallback
    if (!tokenOk && user.otp && String(user.otp) === String(token)) {
      const now = new Date();
      if (user.expires && user.expires >= now) tokenOk = true;
    }
  }

  if (!tokenOk) throw new Error('Mã xác thực không hợp lệ');

  // clear all 2FA data
  await models.User.update({
    totp_secret: null,
    totp_temp_secret: null,
    otp: null,
    expires: null,
    two_factor_enabled: 0,
    email_two_factor_enabled: 0,
    updated_date: new Date()
  }, { where: { id: userId } });

  return { success: true };
};

// --- TOTP helpers ---
const ENC_KEY = process.env.ENCRYPTION_KEY || null;
const ALGO = 'aes-256-cbc';
const ivFromKey = (key) => {
  // derive a 16 bytes IV from key (not ideal for prod, but acceptable for local dev)
  const hash = crypto.createHash('md5').update(String(key)).digest();
  return hash;
};

const encryptSecret = (plain) => {
  if (!ENC_KEY) return plain; // fallback (insecure) when no key provided
  const iv = ivFromKey(ENC_KEY);
  const cipher = crypto.createCipheriv(ALGO, Buffer.from(ENC_KEY).slice(0,32), iv);
  let encrypted = cipher.update(String(plain), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
};

const decryptSecret = (encrypted) => {
  if (!ENC_KEY) return encrypted;
  const iv = ivFromKey(ENC_KEY);
  const decipher = crypto.createDecipheriv(ALGO, Buffer.from(ENC_KEY).slice(0,32), iv);
  let dec = decipher.update(String(encrypted), 'base64', 'utf8');
  dec += decipher.final('utf8');
  return dec;
};

// Start TOTP setup: generate secret, save temp secret, return QR data URL and secret (base32)
export const startTotpSetup = async (userId) => {
  const user = await models.User.findByPk(userId);
  if (!user) throw new Error('User not found');

  const secret = speakeasy.generateSecret({ length: 20 });
  // save temporary secret (base32)
  await models.User.update({ totp_temp_secret: secret.base32, updated_date: new Date() }, { where: { id: userId } });

  const label = `${process.env.APP_NAME || 'Esports'}:${user.email}`;
  const otpauth = speakeasy.otpauthURL({ secret: secret.base32, label, issuer: process.env.APP_NAME || 'Esports', encoding: 'base32' });
  const qrDataUrl = await qrcode.toDataURL(otpauth);

  return { qr: qrDataUrl, secret: secret.base32 };
};

// Confirm TOTP setup: verify code against temp secret, promote to stored secret
export const confirmTotpSetup = async (userId, token) => {
  const user = await models.User.findByPk(userId);
  if (!user) throw new Error('User not found');
  if (!user.totp_temp_secret) throw new Error('No TOTP setup in progress');

  const verified = speakeasy.totp.verify({ secret: user.totp_temp_secret, encoding: 'base32', token, window: 1 });
  if (!verified) throw new Error('Mã TOTP không hợp lệ');

  // encrypt and save
  const encrypted = encryptSecret(user.totp_temp_secret);
  await models.User.update({ totp_secret: encrypted, totp_temp_secret: null, two_factor_enabled: 1, updated_date: new Date() }, { where: { id: userId } });
  return { success: true };
};

// Disable TOTP: require password OR valid TOTP token
export const disableTotp = async (userId, password) => {
  // disable TOTP using password verification only (no OTP required)
  if (!password) throw new Error('Mật khẩu không được để trống');
  await verifyUserPassword(userId, password);

  const user = await models.User.findByPk(userId);
  if (!user) throw new Error('User not found');

  // clear TOTP secret; if email 2FA isn't enabled, also clear two_factor_enabled
  const updateData = { totp_secret: null, updated_date: new Date() };
  if (!user.email_two_factor_enabled) updateData.two_factor_enabled = 0;

  await models.User.update(updateData, { where: { id: userId } });
  return { success: true };
};

// Disable Email two-factor using password only
export const disableEmailByPassword = async (userId, password) => {
  if (!password) throw new Error('Mật khẩu không được để trống');
  await verifyUserPassword(userId, password);

  const user = await models.User.findByPk(userId);
  if (!user) throw new Error('User not found');

  // clear email flag; if no TOTP secret then disable overall two_factor_enabled
  const updateData = { email_two_factor_enabled: 0, otp: null, expires: null, updated_date: new Date() };
  if (!user.totp_secret) updateData.two_factor_enabled = 0;

  await models.User.update(updateData, { where: { id: userId } });
  return { success: true };
};

// Login confirm with TOTP (public): verify and issue tokens
export const loginConfirmTotp = async (account, token) => {
  if (!account || !token) throw new Error('Thiếu thông tin xác thực 2FA');

  const user = await models.User.findOne({ where: { [Op.or]: [ { email: account }, { username: account } ], status: 1, deleted: 0 } });
  if (!user) throw new Error('Tài khoản không tồn tại');
  if (!user.totp_secret) throw new Error('TOTP chưa bật cho tài khoản này');

  const secret = decryptSecret(user.totp_secret);
  const verified = speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 });
  if (!verified) throw new Error('Mã TOTP không hợp lệ');

  // issue tokens
  const accessToken = jwt_token.signAccessToken(user);
  const refreshToken = jwt_token.signRefreshToken(user);

  let teamInfo = null;
  if (user.role === 3) {
    const team = await models.Team.findOne({ where: { leader_id: user.id }, attributes: ["id", "name", "wallet_address", "private_key"] });
    if (team) teamInfo = team;
  }

  const userInfo = { id: user.id, username: user.username, full_name: user.full_name, email: user.email, role: user.role, team: teamInfo };

  return { accessToken, refreshToken, userInfo };
};