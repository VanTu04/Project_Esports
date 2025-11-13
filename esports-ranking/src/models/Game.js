'use strict';
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Game = sequelize.define('Game', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    game_name: {
      type: DataTypes.STRING(191),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      defaultValue: 'ACTIVE'
    },
    deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'games',
    timestamps: true,
    createdAt: 'created_date',
    updatedAt: 'updated_date'
  });

  // Associations
  Game.associate = (models) => {
    Game.hasMany(models.Season, { foreignKey: 'game_id', as: 'seasons' });
  };

  return Game;
};
