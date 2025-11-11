import sequelize from '../config/config.js';
import { DataTypes, Sequelize } from 'sequelize';

import defineUser from './User.js';
import defineOtp from './Otp.js';
import defineTeam from './Team.js';
import defineGame from './Game.js';
import defineTournament from './Tournament.js';
import defineRanking from './Ranking.js';
import defineRankingBoard from './RankingBoard.js';

// Khởi tạo models
const User = defineUser(sequelize, DataTypes);
const user_otp = defineOtp(sequelize, DataTypes);
const Team = defineTeam(sequelize, DataTypes);
const Game = defineGame(sequelize, DataTypes);
const Tournament = defineTournament(sequelize, DataTypes);
const Ranking = defineRanking(sequelize, DataTypes);
const RankingBoard = defineRankingBoard(sequelize, DataTypes);

// Thiết lập quan hệ

export { sequelize, Sequelize, User, user_otp, Game, Team, Tournament, Ranking, RankingBoard };

//Thêm dòng này nếu bạn muốn import models như 1 object
export default {
  sequelize,
  Sequelize,
  User,
  user_otp,
  Team,
  Game,
  Tournament,
  Ranking,
  RankingBoard
};