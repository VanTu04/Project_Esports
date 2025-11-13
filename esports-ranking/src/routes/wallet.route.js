import express from "express";
import * as walletController from "../controllers/WalletController.js";
import { checkAccessToken } from "../middlewares/jwt_token.js";

const router = express.Router();

/**
 * @route   GET /wallet/:address/balance
 * @desc    Lấy số dư ví của user
 * @access  ADMIN, USER đều có thể xem (tùy bạn quyết định)
 */
router.get("/balance", checkAccessToken, walletController.getBalanceController);

/**
 * @route   GET /wallet/:address/transactions
 * @desc    Lấy danh sách giao dịch của user
 * @access  ADMIN, USER đều có thể xem
 */
router.get("/transactions", checkAccessToken, walletController.getTransactionsController);

export default router;
