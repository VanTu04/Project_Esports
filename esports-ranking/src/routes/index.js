import express from 'express';
import usersRouter from './user.route.js';
import gamesRouter from './game.route.js';
import teamsRouter from './team.route.js';

const router = express.Router();

router.use('/users', usersRouter);
router.use('/games', gamesRouter);
router.use('/teams', teamsRouter);

export default router;