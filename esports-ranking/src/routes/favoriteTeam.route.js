import express from 'express';
import * as favoriteTeamController from '../controllers/FavoriteTeamController.js';
import { checkAccessToken } from '../middlewares/jwt_token.js';

const router = express.Router();

// All routes require authentication
router.post('/', checkAccessToken, favoriteTeamController.addFavoriteTeam);
router.delete('/:team_id', checkAccessToken, favoriteTeamController.removeFavoriteTeam);
router.get('/', checkAccessToken, favoriteTeamController.getFavoriteTeams);
router.get('/check/:team_id', checkAccessToken, favoriteTeamController.checkFavoriteTeam);
router.post('/status', checkAccessToken, favoriteTeamController.getFavoriteStatus);

export default router;
