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
    isReady: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Đánh dấu giải đấu đã sẵn sàng bắt đầu hay chưa'
    },
    leaderboard_saved: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Đánh dấu bảng xếp hạng đã được lưu hay chưa'
    },
    reward_distributed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Đánh dấu phần thưởng đã được phân phối hay chưa'
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
    start_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Ngày bắt đầu dự kiến của giải đấu'
    },

    end_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Ngày kết thúc dự kiến của giải đấu'
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Thời gian bắt đầu giải đấu'
    },

    end_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Thời gian kết thúc giải đấu'
    },
    registration_fee: {
      type: DataTypes.DECIMAL,
      default: 1,
      comment: 'Số tiền để đăng kí tham gia giải đấu'
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
    Tournament.hasMany(models.TournamentReward, {
      foreignKey: 'tournament_id',
      as: 'rewards'
    });
  };

  return Tournament;
};