import sequelize from '../config/config.js';
import { DataTypes, Sequelize } from 'sequelize';

// Import từng model
import defineUser from './User.js';
import defineOtp from './Otp.js';
import defineTeam from './Team.js';
import defineTeamMember from './TeamMember.js';
import defineGame from './Game.js';
import defineSeason from './Season.js';
import defineTournament from './Tournament.js';
import defineRanking from './Ranking.js';
import defineRankingBoard from './RankingBoard.js';
import defineParticipant from './Participant.js';
import defineMatch from './Match.js';

// --- Khởi tạo models ---
const User = defineUser(sequelize, DataTypes);
const user_otp = defineOtp(sequelize, DataTypes);
const Team = defineTeam(sequelize, DataTypes);
const TeamMember = defineTeamMember(sequelize, DataTypes);
const Game = defineGame(sequelize, DataTypes);
const Season = defineSeason(sequelize, DataTypes);
const Tournament = defineTournament(sequelize, DataTypes);
const Ranking = defineRanking(sequelize, DataTypes);
const RankingBoard = defineRankingBoard(sequelize, DataTypes);
const Participant = defineParticipant(sequelize, DataTypes);
const Match = defineMatch(sequelize, DataTypes);

// --- Gom tất cả models vào 1 object ---
const models = {
  User,
  user_otp,
  Team,
  TeamMember,
  Game,
  Season,
  Tournament,
  Ranking,
  RankingBoard,
  Participant,
  Match
};

// --- Gọi associate() cho từng model nếu có ---
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// --- Xuất ---
export { sequelize, Sequelize, User, user_otp, Team, TeamMember, Game, Season, Tournament, Ranking, RankingBoard, Participant, Match };

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
  RankingBoard,
  Participant,
  Match
};
