import sequelize from '../config/config.js';
import { DataTypes, Sequelize } from 'sequelize';

import defineUser from './User.js';
import defineOtp from './Otp.js';
import defineTeam from './Team.js';
import defineTeamMember from './TeamMember.js';
import defineGame from './Game.js';
import defineSeason from './Season.js';
import defineTournament from './Tournament.js';
import defineRanking from './Ranking.js';
import defineRankingBoard from './RankingBoard.js';

// Khởi tạo models
const User = defineUser(sequelize, DataTypes);
const user_otp = defineOtp(sequelize, DataTypes);
const Team = defineTeam(sequelize, DataTypes);
const TeamMember = defineTeamMember(sequelize, DataTypes);
const Game = defineGame(sequelize, DataTypes);
const Season = defineSeason(sequelize, DataTypes);
const Tournament = defineTournament(sequelize, DataTypes);
const Ranking = defineRanking(sequelize, DataTypes);
const RankingBoard = defineRankingBoard(sequelize, DataTypes);

// Đưa các models vào một object để associate
const models = {
  User,
  user_otp,
  Team,
  TeamMember,
  Game,
  Season,
  Tournament,
  Ranking,
  RankingBoard
};

// Gọi associate cho tất cả models có định nghĩa associate
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

export { sequelize, Sequelize, User, user_otp, Game, Team, TeamMember, Season, Tournament, Ranking, RankingBoard };

export default {
  sequelize,
  Sequelize,
  User,
  user_otp,
  Team,
  TeamMember,
  Game,
  Season,
  Tournament,
  Ranking,
  RankingBoard
};