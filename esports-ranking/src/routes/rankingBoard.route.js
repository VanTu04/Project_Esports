import express from 'express';
import * as rankingBoardController from '../controllers/RankingBoardController.js';
import { checkRole } from '../middlewares/jwt_token.js';
import roles from '../constant/roles.js';

const router = express.Router();

// 🧩 Tạo bảng xếp hạng mới cho 1 giải đấu
router.post('/', checkRole([roles.ADMIN]), rankingBoardController.createRankingBoard);

// 👁️ Lấy chi tiết bảng xếp hạng theo tournament_id
router.get('/:tournament_id', rankingBoardController.getRankingBoard);

// 🔁 Cập nhật trạng thái (Chưa diễn ra / Đang diễn ra / Đã xong)
router.put('/:id/status', checkRole([roles.ADMIN]), rankingBoardController.updateStatus);

export default router;
