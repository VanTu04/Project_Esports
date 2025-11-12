import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import models from '../models/index.js';
import * as jwt_token from '../middlewares/jwt_token.js';
import * as MailHelper from '../helper/MailHelper.js';
import { decrypt, generateWallet } from '../utils/wallet.js';

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

    // Tạo ví mới cho user (admin hoặc team đều có)
    const wallet = generateWallet();
    console.log("Wallet generated:", wallet);

    // Tạo user trong DB và gán luôn ví
    const newUser = await models.User.create({
      username: data.username,
      full_name: data.full_name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      status: 1,
      deleted: 0,
      wallet_address: wallet.address,
      private_key: wallet.privateKey,
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

    // --- Import ví mới vào Hardhat node ---
    try {
      const fetch = (await import('node-fetch')).default;
      const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
      // 1. Impersonate
      await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "hardhat_impersonateAccount",
          params: [wallet.address],
          id: 1
        })
      });
      // 2. Set balance
      const hexBalance = "0x" + (10n ** 18n).toString(16); // 1 ETH
      await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "hardhat_setBalance",
          params: [wallet.address, hexBalance],
          id: 2
        })
      });
      console.log(`Impersonated & funded ${wallet.address} on Hardhat node.`);
    } catch (rpcErr) {
      console.warn('Không thể import ví vào Hardhat node:', rpcErr.message);
    }

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
    attributes: ['id', 'username', 'full_name', 'email', 'role', 'wallet_address', 'private_key']
  });

  if (!user) {
    throw new Error('User not found');
  }

  user = {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    wallet_address: user.wallet_address,
    private_key: decrypt(user.private_key)
  }

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