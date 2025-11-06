import express from 'express';
import * as gameController from '../controllers/GameController.js';
import { checkRole } from '../middlewares/jwt_token.js';
import roles from '../constant/roles.js';

const router = express.Router();

router.post('/', checkRole([roles.ADMIN]), gameController.createGame);
router.get('/', gameController.getAllGames);
router.get('/:id', gameController.getGameById);
router.put('/:id', checkRole([roles.ADMIN]), gameController.updateGame);
router.delete('/:id', checkRole([roles.ADMIN]), gameController.deleteGame);

export default router;
