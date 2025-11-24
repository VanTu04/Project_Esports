import express from 'express';
import * as distribute from '../controllers/DistributeRewardsController.js';
import { checkRole } from '../middlewares/jwt_token.js';
import roles from '../constant/roles.js';

const router = express.Router();

router.post('/', checkRole([roles.ADMIN]), distribute.distributeTournamentRewards);
router.post('/fund-contract', checkRole([roles.ADMIN]), distribute.fundContract);
router.get('/contract-balance', checkRole([roles.ADMIN]), distribute.checkContractBalance);

export default router;
