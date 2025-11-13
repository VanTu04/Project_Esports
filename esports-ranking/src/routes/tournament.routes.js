import express from 'express';
import * as tournamentController from '../controllers/TournamentController.js';
import { checkAccessToken, checkRole } from '../middlewares/jwt_token.js';
import roles from '../constant/roles.js';

const router = express.Router();

/**
 * @route   POST /api/tournaments
 * @desc    Tạo một giải đấu mới
 * @access  Admin
 */
router.post(
  '/',
  checkRole([roles.ADMIN]),
  tournamentController.createTournament
);

/**
 * @route   GET /api/tournaments
 * @desc    Lấy danh sách tất cả giải đấu (có thể lọc theo status)
 * @access  Public
 */
router.get(
  '/',
  tournamentController.getAllTournaments
);

/**
 * @route   GET /api/tournaments/:id
 * @desc    Lấy thông tin chi tiết 1 giải đấu (bao gồm các đội tham gia)
 * @access  Public
 */
router.get(
  '/:id',
  tournamentController.getTournamentById
);

/**
 * @route   PUT /api/tournaments/:id
 * @desc    Cập nhật thông tin giải đấu
 * @access  Admin
 * @note    (Bạn sẽ cần tạo hàm 'updateTournament' trong controller/service)
 */
router.put(
  '/:id',
  checkRole([roles.ADMIN]),
  tournamentController.updateTournament
);

/**
 * @route   DELETE /api/tournaments/:id
 * @desc    Xóa/hủy một giải đấu
 * @access  Admin
 * @note    (Bạn sẽ cần tạo hàm 'deleteTournament' trong controller/service)
 */
router.delete(
  '/:id',
  checkRole([roles.ADMIN]),
  tournamentController.deleteTournament 
);

// === CÁC ROUTE NGHIỆP VỤ GIẢI ĐẤU (Đặc thù) ===

/**
 * @route   POST /api/tournaments/:id/register
 * @desc    Đăng ký một đội (User) vào giải đấu
 * @access  Admin (Giả định Admin là người thực hiện)
 */
router.post(
  '/:id/register',
  checkRole([roles.ADMIN]),
  tournamentController.registerTeam
);

router.post(
  '/:id/request-join',
  checkRole([roles.USER, roles.TEAM_MANAGER, roles.ADMIN]), // Cho phép User, Team Manager gọi
  tournamentController.requestJoinTournament
);

router.post(
  '/review-request/:participant_id',
  checkRole([roles.ADMIN]),
  tournamentController.reviewJoinRequest
);

router.post(
  '/:id/start',
  checkRole([roles.ADMIN]),
  tournamentController.startTournament
);

/**
 * @route   GET /api/tournaments/:id/matches
 * @desc    Lấy danh sách trận đấu của tournament (có thể lọc theo round)
 * @access  Public
 * @query   round - Optional: Lọc theo vòng đấu cụ thể
 */
router.get(
  '/:id/matches',
  tournamentController.getTournamentMatches
);

export default router;