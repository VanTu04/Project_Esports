import express from 'express';
import * as seasonController from '../controllers/SeasonController.js';
import { checkRole } from '../middlewares/jwt_token.js';
import roles from '../constant/roles.js';

const router = express.Router();

// Tạo mùa giải - chỉ admin
router.post('/', checkRole([roles.ADMIN]), seasonController.createSeason);

// Lấy tất cả mùa giải
router.get('/', seasonController.getAllSeasons);

// Lấy danh sách mùa giải theo game (phải để trước /:id)
router.get('/game/:gameId', seasonController.getSeasonsByGameId);

// Lấy mùa giải theo ID
router.get('/:id', seasonController.getSeasonById);

// Cập nhật mùa giải - chỉ admin
router.put('/:id', checkRole([roles.ADMIN]), seasonController.updateSeason);

// Xóa mùa giải - chỉ admin
router.delete('/:id', checkRole([roles.ADMIN]), seasonController.deleteSeason);

export default router;
