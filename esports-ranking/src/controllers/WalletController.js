import * as walletService from "../services/WalletService.js";
import models from "../models/index.js";

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

    const data = await walletService.getWalletBalance(user.wallet_address);

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

    let { page = 1, size = 10 } = req.query;

    page = parseInt(page);
    size = parseInt(size);

    const result = await walletService.getUserTransactions(id, page, size);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách giao dịch thành công",
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      data: result.transactions,
    });
  } catch (error) {
    console.error("GET TRANSACTION ERROR:", error);
    return responseWithError(res, 500, "Lỗi lấy lịch sử giao dịch");
  }
};


/**
 * POST /tournaments/:tournamentId/distribute-rewards
 */
export const distributeRewardsController = async (req, res) => {
  try {
    const { idTournament } = req.body;
    if (!idTournament) return res.status(400).json({ success: false, message: "Missing idTournament" });

    const results = await walletService.distributeRewardsTournament(idTournament);

    res.json({ success: true, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};