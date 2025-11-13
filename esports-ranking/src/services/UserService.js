import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import models from '../models/index.js';
import * as jwt_token from '../middlewares/jwt_token.js';
import * as MailHelper from '../helper/MailHelper.js';
import { decrypt, generateWallet } from '../utils/wallet.js';
import { fundWalletOnAnvil } from '../init/initAdmin.js';

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