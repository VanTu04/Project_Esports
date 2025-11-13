'use strict';
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Tournament = sequelize.define('Tournament', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'ACTIVE', 'COMPLETED'),
      defaultValue: 'PENDING',
      allowNull: false
    },
    total_rounds: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Tổng số vòng (do Admin quyết định)'
    },
    current_round: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Đang ở vòng số mấy'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    game_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'games',
        key: 'id'
      }
    },
    season_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'seasons',
        key: 'id'
      }
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    deleted: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'tournaments',
    timestamps: true,
  });

  Tournament.associate = (models) => {
    // Một giải đấu có nhiều Đội tham gia
    Tournament.hasMany(models.Participant, { 
      foreignKey: 'tournament_id', 
      as: 'participants' 
    });
    // Một giải đấu có nhiều Trận đấu
    Tournament.hasMany(models.Match, { 
      foreignKey: 'tournament_id', 
      as: 'matches' 
    });
    // Một giải đấu được tạo bởi 1 Admin (User)
    Tournament.belongsTo(models.User, { 
      foreignKey: 'created_by', 
      as: 'admin' 
    });
    // Một giải đấu thuộc về 1 Game
    Tournament.belongsTo(models.Game, {
      foreignKey: 'game_id',
      as: 'Game'
    });
    // Một giải đấu thuộc về 1 Season
    Tournament.belongsTo(models.Season, {
      foreignKey: 'season_id',
      as: 'Season'
    });
  };

  return Tournament;
};