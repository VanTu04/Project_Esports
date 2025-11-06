'use strict';
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Ranking = sequelize.define('Ranking', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    tournament_id: { type: DataTypes.INTEGER, allowNull: false },
    team_id: { type: DataTypes.INTEGER, allowNull: false },
    points: { type: DataTypes.INTEGER, defaultValue: 0 },
    rank: { type: DataTypes.INTEGER, allowNull: true },
    on_chain_hash: { type: DataTypes.STRING, allowNull: true }, // hash blockchain
  }, {
    tableName: 'rankings',
    timestamps: true,
  });

  Ranking.associate = (models) => {
    Ranking.belongsTo(models.Team, { foreignKey: 'team_id', as: 'team' });
    Ranking.belongsTo(models.Tournament, { foreignKey: 'tournament_id', as: 'tournament' });
  };

  return Ranking;
};
