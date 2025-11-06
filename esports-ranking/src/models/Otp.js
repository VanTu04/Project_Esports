'use strict';
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const UserOtp = sequelize.define('user_otps', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: DataTypes.INTEGER,
    otp: DataTypes.STRING,
    expired_at: DataTypes.DATE
  }, {
    tableName: 'user_otps',
    timestamps: true
  });

  return UserOtp;
};
