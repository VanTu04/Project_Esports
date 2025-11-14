'use strict';
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Participant = sequelize.define('Participant', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    tournament_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tournaments', // Tên bảng (tableName)
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users', // Tên bảng 'User' của bạn
        key: 'id'
      }
    },
    // Sao chép thông tin để truy vấn nhanh, không cần JOIN
    wallet_address: {
      type: DataTypes.STRING,
      allowNull: false
    },
    team_name: {
      type: DataTypes.STRING
    },
    has_received_bye: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Đã nhận "Bye" (miễn đấu) chưa?'
    },
    total_points: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM(
        'PENDING',  // 1. Team đã gửi, chờ Admin duyệt
        'APPROVED', // 2. Admin đã duyệt, sẵn sàng thi đấu
        'REJECTED'  // 3. Admin (hoặc hệ thống) đã từ chối
      ),
      defaultValue: 'PENDING',
      allowNull: false
    }
  }, {
    tableName: 'participants',
    timestamps: true,
    // Đảm bảo 1 đội chỉ tham gia 1 giải 1 lần
    indexes: [
      {
        unique: true,
        fields: ['tournament_id', 'user_id']
      }
    ]
  });

  Participant.associate = (models) => {
    Participant.belongsTo(models.Tournament, { 
      foreignKey: 'tournament_id', 
      as: 'tournament' 
    });
    Participant.belongsTo(models.User, { 
      foreignKey: 'user_id', 
      as: 'team' 
    });
  };

  return Participant;
};