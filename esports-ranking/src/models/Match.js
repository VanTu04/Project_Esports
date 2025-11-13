'use strict';
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Match = sequelize.define('Match', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    tournament_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tournaments', // Tên bảng (tableName)
        key: 'id'
      }
    },
    round_number: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    team_a_participant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'participants', // Tên bảng (tableName)
        key: 'id'
      },
      comment: 'ID của Đội A (tham chiếu Participant)'
    },
    team_b_participant_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Phải là NULL nếu Đội A nhận "Bye"
      references: {
        model: 'participants', // Tên bảng (tableName)
        key: 'id'
      },
      comment: 'ID của Đội B (tham chiếu Participant)'
    },
    winner_participant_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Sẽ là NULL khi status = 'pending'
      references: {
        model: 'participants', // Tên bảng (tableName)
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'COMPLETED', 'CANCELLED'),
      defaultValue: 'PENDING',
    },
    match_time: {
      type: DataTypes.DATE, // Lưu trữ cả ngày và giờ
      allowNull: true,
      comment: 'Thời gian thi đấu (do Admin gán)'
    }
  }, {
    tableName: 'matches',
    timestamps: true,
  });

  Match.associate = (models) => {
    Match.belongsTo(models.Tournament, { 
      foreignKey: 'tournament_id', 
      as: 'tournament' 
    });
    
    // Tạo 3 mối quan hệ với Participant
    Match.belongsTo(models.Participant, { 
      foreignKey: 'team_a_participant_id', 
      as: 'teamA' 
    });
    Match.belongsTo(models.Participant, { 
      foreignKey: 'team_b_participant_id', 
      as: 'teamB' 
    });
    Match.belongsTo(models.Participant, { 
      foreignKey: 'winner_participant_id', 
      as: 'winner' 
    });
  };

  return Match;
};