'use strict';
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Users = sequelize.define('users', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER(4),
    },
    username: { type: DataTypes.STRING(50), unique: true, allowNull: false },
    full_name: DataTypes.STRING(255),
    password: DataTypes.STRING(255),
    gender: DataTypes.INTEGER(2),
    email: DataTypes.STRING(255),
    phone: DataTypes.STRING(15),
    avatar: DataTypes.TEXT('long'),
    cover_image: DataTypes.TEXT('long'),

    role: { type: DataTypes.INTEGER(2), defaultValue: 1 },
    otp: DataTypes.STRING(15),
    expires: DataTypes.DATE,
    google_id: DataTypes.STRING(1024),
    facebook_id: DataTypes.STRING(1024),
    status: { type: DataTypes.INTEGER(2), defaultValue: 0 },
    deleted: { type: DataTypes.INTEGER(2), defaultValue: 0 },

    wallet_address: DataTypes.STRING(255),
    private_key: DataTypes.STRING(255),

    created_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    created_by: DataTypes.STRING(255),
    updated_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    timestamps: false,
    tableName: 'users',
  });

  return Users;
};