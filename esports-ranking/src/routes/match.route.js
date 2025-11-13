import express from 'express';
import * as matchController from '../controllers/MatchController.js';
import { checkRole } from '../middlewares/jwt_token.js';
import roles from '../constant/roles.js';

const router = express.Router();

// === 1. Lấy lịch thi đấu theo tournament_id & round_number ===
router.get('/matches', matchController.getAllMatches); 
// query: ?tournament_id=1&round_number=1

// === 2. Báo cáo kết quả trận đấu (cập nhật blockchain) ===
router.post('/match/:id/report', checkRole([roles.ADMIN]), matchController.reportMatchResult);

// === 3. Cập nhật thời gian thi đấu ===
router.put('/match/:id/schedule', checkRole([roles.ADMIN]), matchController.scheduleMatchTime);

// === 4. Lấy điểm trận đấu từ blockchain ===
router.get('/match/:matchId/score', matchController.getMatchScore);

// === 5. Lấy tất cả trận đấu theo tournament từ blockchain ===
router.get('/tournament/:tournamentId/matches', matchController.getMatchesByTournament);

export default router;
