import express from "express";
import { checkAccessToken, checkRole } from "../middlewares/jwt_token.js";
import { getAllBlockchainTransactions } from "../controllers/BlockchainController.js";

const router = express.Router();

/**
 * @route GET /blockchain/transactions
 * @desc  Lấy toàn bộ lịch sử giao dịch (admin only)
 */
router.get(
  "/transactions",
  checkAccessToken,
  checkRole(["admin"]),     // DÙNG middleware có sẵn
  getAllBlockchainTransactions
);

export default router;
