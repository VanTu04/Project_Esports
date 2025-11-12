import bcrypt from "bcrypt";
import models from "../models/index.js";
import { getAdminWallet } from "../utils/wallet.js";

export const initAdminAccount = async () => {
  try {
    const adminUsername = process.env.ADMIN_USERNAME || "admin123";
    const existing = await models.User.findOne({ where: { username: adminUsername } });

    if (existing) {
      console.log("Admin đã tồn tại:", existing.username);
      return existing;
    }

    const wallet = getAdminWallet();
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

    const admin = await models.User.create({
      username: adminUsername,
      full_name: "System Admin",
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      role: 4,
      status: 1,
      deleted: 0,
      created_by: null,
      wallet_address: wallet.address,
      private_key: wallet.privateKey
    });

    console.log("Admin khởi tạo thành công:", admin.username);
    console.log("Ví admin:", wallet.address);
    return admin;
  } catch (err) {
    console.error("initAdminAccount error:", err);
  }
};
