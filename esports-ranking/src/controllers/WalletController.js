import { getWalletBalance, getWalletTransactions } from "../services/WalletService.js";
import models from "../models/index.js"; // Sequelize models

/**
 * API: Lấy số dư ví (ETH) của user đăng nhập
 * GET /wallet/balance
 */
export const getBalanceController = async (req, res) => {
  try {
    const { id } = req.user;
    console.log("user", req.user);
    if (!id) throw new Error("User chưa đăng nhập");

    // Lấy address từ DB
    const user = await models.User.findByPk(id);
    console.log("user db", user);
    if (!user || !user.wallet_address) throw new Error("Không tìm thấy ví của user");

    const data = await getWalletBalance(user.wallet_address);

    return res.status(200).json({
      success: true,
      message: "Lấy số dư thành công",
      data,
    });
  } catch (error) {
    console.error("[getBalanceController] error:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * API: Lấy danh sách giao dịch của user đăng nhập
 * GET /wallet/transactions
 */
export const getTransactionsController = async (req, res) => {
  try {
    const { id } = req.user;
    if (!id) throw new Error("User chưa đăng nhập");

    // Lấy address từ DB
    const user = await models.User.findByPk(id);
    if (!user || !user.wallet_address) throw new Error("Không tìm thấy ví của user");

    const transactions = await getWalletTransactions(user.wallet_address);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách giao dịch thành công",
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error("[getTransactionsController] error:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
