// models/TournamentReward.js
'use strict';
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const TournamentReward = sequelize.define('TournamentReward', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    tournament_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tournaments',
        key: 'id'
      },
      comment: 'ID của giải đấu'
    },

    rank: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Xếp hạng, ví dụ 1 = top1'
    },

    reward_amount: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false,
      comment: 'Số tiền ETH/Token tương ứng cho hạng này'
    },
    hash: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Hash giao dịch phân phối giải thưởng'
    },
    distributed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Thời gian phân phối giải thưởng'
    },
    blockNumber: {
      type: DataTypes.INTEGER,
      comment: 'Số block khi giao dịch được xác nhận'
    }
  }, {
    tableName: 'tournament_rewards',
    timestamps: true,
  });

  TournamentReward.associate = (models) => {
    // Một giải đấu có nhiều reward tier
    TournamentReward.belongsTo(models.Tournament, {
      foreignKey: 'tournament_id',
      as: 'tournament'
    });
  };

  return TournamentReward;
};