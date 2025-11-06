import sequelize from '../config/config.js';
import { DataTypes, Sequelize } from 'sequelize';

import defineUser from './User.js';
import defineOtp from './Otp.js';
import defineTeam from './Team.js';
import defineGame from './Game.js';

// Khởi tạo models
const User = defineUser(sequelize, DataTypes);
const user_otp = defineOtp(sequelize, DataTypes);
const Team = defineTeam(sequelize, DataTypes);
const Game = defineGame(sequelize, DataTypes);

// Thiết lập quan hệ

export { sequelize, Sequelize, User, user_otp, Game, Team };

//Thêm dòng này nếu bạn muốn import models như 1 object
export default {
  sequelize,
  Sequelize,
  User,
  user_otp,
  Team,
  Game
};