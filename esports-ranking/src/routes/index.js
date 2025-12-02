import express from 'express';
import usersRouter from './user.route.js';
import gamesRouter from './game.route.js';
import teamsRouter from './team.route.js';
import seasonRouter from './season.route.js';
import tournamentRouter from './tournament.routes.js';
import walletRouter from './wallet.route.js';
import matchRouter from './match.route.js';
import distributeRewardsRouter from './distributeRewards.route.js';
import favoriteTeamRouter from './favoriteTeam.route.js';

const router = express.Router();

router.use('/users', usersRouter);
router.use('/games', gamesRouter);
router.use('/teams', teamsRouter);
router.use('/seasons', seasonRouter);
router.use('/tournaments', tournamentRouter);
router.use('/wallet', walletRouter);
router.use('/matches', matchRouter);
router.use('/distribute-rewards', distributeRewardsRouter);
router.use('/favorite-teams', favoriteTeamRouter);

export default router;