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
    registration_fee: {
      type: DataTypes.DECIMAL,
      defaultValue: 1,
      comment: 'Số tiền để đăng ký tham gia giải đấu'
    },
    status: {
      type: DataTypes.ENUM(
        'PENDING',  // 1. Team đã gửi, chờ Admin duyệt
        'APPROVED', // 2. Admin đã duyệt, sẵn sàng thi đấu
        'REJECTED',  // 3. Admin (hoặc hệ thống) đã từ chối
        'WAITING_APPROVAL', // đã nạp tiền chờ duyệt
      ),
      defaultValue: 'PENDING',
      allowNull: false
    },
    approved_at: {
      type: DataTypes.DATE,
      comment: 'Ngày duyệt'
    },
    approval_tx_hash: {
      type: DataTypes.STRING,
      comment: 'Mã hash duyệt'
    },
    rejection_reason: {
      type: DataTypes.STRING,
      comment: 'Lý do từ chối'
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