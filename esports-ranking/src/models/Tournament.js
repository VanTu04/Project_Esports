'use strict';
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Tournament = sequelize.define('Tournament', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    game_name: { type: DataTypes.STRING, allowNull: false },
    season: { type: DataTypes.STRING, allowNull: true },
    status: {
      type: DataTypes.ENUM('UPCOMING', 'ONGOING', 'FINISHED'),
      defaultValue: 'UPCOMING',
    },
    start_date: { type: DataTypes.DATE, allowNull: true },
    end_date: { type: DataTypes.DATE, allowNull: true },
  }, {
    tableName: 'tournaments',
    timestamps: true,
  });

  Tournament.associate = (models) => {
    Tournament.hasMany(models.Ranking, { foreignKey: 'tournament_id', as: 'rankings' });
  };

  return Tournament;
};