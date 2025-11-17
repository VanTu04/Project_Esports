'use strict';
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const TransactionHistory = sequelize.define('TransactionHistory', {
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

    participant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    actor: {
      type: DataTypes.ENUM(
        'ADMIN',
        'TEAM',
        'ANONYMOUS'
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
        'DISTRIBUTE_REWARD'   // admin phân phối thưởng
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
      comment: 'Số tiền (đơn vị wei)'
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