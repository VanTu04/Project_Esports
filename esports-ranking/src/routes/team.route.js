import express from 'express';
import * as teamController from '../controllers/TeamController.js';
import { checkRole } from '../middlewares/jwt_token.js';
import roles from '../constant/roles.js';

const router = express.Router();

router.get('/', teamController.getAllTeams);
router.get('/top/wins', teamController.getTopTeamsByWins);
router.get('/:id', teamController.getTeamById);
router.put('/:id', checkRole([roles.ADMIN]), teamController.updateTeamWallet);

export default router;
