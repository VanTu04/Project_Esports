'use strict';
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const RankingBoard = sequelize.define('RankingBoard', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    game_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    season_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('DRAFT', 'ACTIVE', 'CLOSED'),
      defaultValue: 'DRAFT'
    },
    created_by: DataTypes.INTEGER,
    updated_by: DataTypes.INTEGER
  }, {
    tableName: 'ranking_boards',
    timestamps: true,
    createdAt: 'created_date',
    updatedAt: 'updated_date'
  });

  RankingBoard.associate = (models) => {
    RankingBoard.belongsTo(models.Game, { foreignKey: 'game_id' });
  };

  return RankingBoard;
};
