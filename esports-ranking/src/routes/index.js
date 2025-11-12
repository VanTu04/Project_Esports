import express from 'express';
import usersRouter from './user.route.js';
import gamesRouter from './game.route.js';
import teamsRouter from './team.route.js';
import seasonRouter from './season.route.js';
import rankingBoardRouter from './rankingBoard.route.js';

const router = express.Router();

router.use('/users', usersRouter);
router.use('/games', gamesRouter);
router.use('/teams', teamsRouter);
router.use('/seasons', seasonRouter);
router.use('/ranking-board', rankingBoardRouter);

export default router;