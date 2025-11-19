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
  tournamentController.createTournamentWithRewards
);

router.post(
  '/isReady',
  checkRole([roles.ADMIN]),
  tournamentController.isReadyTrue
)

/**
 * @route   GET /api/tournaments
 * @desc    Lấy danh sách tất cả giải đấu (có thể lọc theo status)
 * @access  Public
 */
router.get(
  '/',
  tournamentController.getAllTournaments
);


router.get(
  '/admin',
  checkRole([roles.ADMIN]),
  tournamentController.getAllTournamentsAdmin
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
  tournamentController.updateTournamentRewards
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
 * Bước 1: User lấy signature để đăng ký
 * Response: { signature, amountInWei, amountInEth, contractAddress }
 */
router.post(
  '/:id/register', 
  checkAccessToken, 
  tournamentController.requestJoinTournament
);

/**
 * Bước 2: User xác nhận đã gọi Smart Contract thành công
 * Body: { tx_hash: "0x..." }
 * Response: { success, participant }
 */
router.post(
  '/:participant_id/confirm',
  checkAccessToken,
  tournamentController.confirmBlockchainRegistration
);

/**
 * Kiểm tra trạng thái đăng ký của chính mình
 * Response: { registered, participant, blockchain }
 */
router.get(
  '/:id/my-registration',
  checkAccessToken,
  tournamentController.getMyRegistrationStatus
);

/**
 * Lấy danh sách chờ duyệt
 * Response: { count, participants }
 */
router.get(
  '/:id/pending-registrations',
  checkRole([roles.ADMIN]),
  tournamentController.getPendingRequests
);

/**
 * Duyệt đăng ký
 * Response: { success, participant, blockchain: { txHash, amountTransferred } }
 */
router.post(
  '/:participant_id/approve',
  checkRole([roles.ADMIN]),
  tournamentController.approveJoinRequest
);

/**
 * Từ chối đăng ký
 * Body: { reason: "Lý do từ chối" } (optional)
 * Response: { success, participant, blockchain: { txHash, amountRefunded } }
 */
router.post(
  '/:participant_id/reject',
  checkRole([roles.ADMIN]),
  tournamentController.rejectJoinRequest
);



router.post(
  '/:id/start',
  checkRole([roles.ADMIN]),
  tournamentController.startTournamentSwiss
);

// Lấy danh sách trận đấu theo vòng
router.post('/rounds/matches', tournamentController.getMatchesByRound);
// POST cập nhật điểm trận đấu
router.post('/matches/:match_id/update-score', tournamentController.updateMatchScore);
// POST /tournaments/:tournament_id/next-round
router.post('/:tournament_id/next-round', tournamentController.startNextRound);

// ghi bxh len blockchain
router.post('/record-ranking/:tournamentId', checkRole([roles.ADMIN]), tournamentController.writeLeaderboardToBlockchain);

// lấy ra bxh từ blockchain
router.post('/bxh/:tournamentId', tournamentController.getFinalLeaderboard);

// Lấy cấu hình reward cho 1 giải
router.get('/:tournament_id/rewards', tournamentController.getTournamentRewards);

// Lấy lịch sử phân phối reward cho 1 giải
router.get('/:tournament_id/distributions', tournamentController.getTournamentDistributions);

export default router;