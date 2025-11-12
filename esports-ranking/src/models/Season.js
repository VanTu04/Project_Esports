'use strict';
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Season = sequelize.define('Season', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    season_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: false
    },
    status: {
      type: DataTypes.ENUM('PREPARING', 'IN_PROGRESS', 'FINISHED'),
      defaultValue: 'PREPARING'
    },
    deleted: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    game_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'seasons',
    timestamps: true,
    createdAt: 'created_date',
    updatedAt: 'updated_date'
  });

  // Associations
  Season.associate = (models) => {
    Season.belongsTo(models.Game, { foreignKey: 'game_id', as: 'game' });
    Season.hasMany(models.Ranking, { foreignKey: 'season_id', as: 'rankings' });
  };

  return Season;
};
