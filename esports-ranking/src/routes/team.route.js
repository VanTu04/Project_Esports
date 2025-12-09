import express from 'express';
import * as teamController from '../controllers/TeamController.js';
import * as favoriteTeamController from '../controllers/FavoriteTeamController.js';
import { checkRole } from '../middlewares/jwt_token.js';
import roles from '../constant/roles.js';

const router = express.Router();

router.get('/', teamController.getAllTeams);
router.get('/rankings', teamController.getTeamRankings);
router.get('/my-team', checkRole([roles.TEAM_MANAGER]), teamController.getMyTeamInfo);
router.put('/my-team', checkRole([roles.TEAM_MANAGER]), teamController.updateMyTeamInfo);
router.get('/my-team/members', checkRole([roles.TEAM_MANAGER]), teamController.getMyTeamMembers);
// Followers / Following (public)
router.get('/:id/followers', favoriteTeamController.getFollowers);
router.get('/:id/following', favoriteTeamController.getFollowing);
router.post('/my-team/members', checkRole([roles.TEAM_MANAGER]), teamController.addTeamMember);
router.delete('/my-team/members/:memberId', checkRole([roles.TEAM_MANAGER]), teamController.removeTeamMember);
router.get('/top/wins', teamController.getTopTeamsByWins);
router.get('/:id', teamController.getTeamById);
router.put('/:id', checkRole([roles.ADMIN]), teamController.updateTeamWallet);

export default router;
