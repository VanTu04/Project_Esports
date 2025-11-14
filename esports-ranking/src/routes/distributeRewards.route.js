import express from 'express';
import * as distribute from '../controllers/DistributeRewardsController.js';
import { checkRole } from '../middlewares/jwt_token.js';
import roles from '../constant/roles.js';

const router = express.Router();

router.post('/:tournament_id/distribute-rewards', checkRole([roles.ADMIN]), distribute.distributeTournamentRewards);

export default router;
