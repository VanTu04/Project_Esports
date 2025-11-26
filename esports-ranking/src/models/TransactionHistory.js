'use strict';
import { type } from 'os';
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const TransactionHistory = sequelize.define('TransactionHistory', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    tournament_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'tournaments',
        key: 'id'
      },
      comment: 'ID của giải đấu'
    },

    participant_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'participants',
        key: 'id'
      },
      comment: 'ID của người tham gia (participant)'
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      comment: 'ID của user'
    },
    from_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID của user gửi tiền (nếu có)'
    },
    to_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID của user nhận tiền (nếu có)'
    },
    actor: {
      type: DataTypes.ENUM(
        'ADMIN',
        'TEAM',
        'ANONYMOUS',
        'SYSTEM'
      ),
      allowNull: false,
      comment: 'Người thực hiện giao dịch'
    },
    
    type: {
      type: DataTypes.ENUM(
        'REGISTER',           // user đăng ký
        'RECEIVE_REFUND',     // user nhận tiền khi bị từ chối
        'REWARD',             // user nhận thưởng
        'APPROVE',            // admin approve đăng ký
        'DISTRIBUTE_REWARD',  // admin phân phối thưởng
        'FUND_CONTRACT',      // admin nạp tiền vào contract
        'RECEIVE_REWARD'      // user nhận tiền từ contract
      ),
      allowNull: false
    },  

    tx_hash: {
      type: DataTypes.STRING(66), // blockchain transaction hash
      allowNull: true
    },

    amount: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      comment: 'Số tiền (đơn vị ETH)'
    },
    
    status: {
      type: DataTypes.ENUM('SUCCESS', 'FAILED', 'PENDING'),
      defaultValue: 'SUCCESS',
      allowNull: false,
      comment: 'Trạng thái giao dịch'
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Mô tả giao dịch'
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'transaction_history',
    timestamps: true,
  });

  return TransactionHistory;
};