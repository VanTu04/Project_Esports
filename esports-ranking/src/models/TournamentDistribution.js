// models/TournamentDistribution.js
'use strict';

export default (sequelize, DataTypes) => {
  const TournamentDistribution = sequelize.define('TournamentDistribution', {
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
      allowNull: true,
      comment: 'Xếp hạng được phân phối (1 = top1)'
    },

    recipient_address: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Địa chỉ ví nhận'
    },

    recipient_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Nếu có, Id người dùng trong hệ thống'
    },

    username: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Tên người dùng (nếu có)'
    },

    amount: {
      type: DataTypes.DECIMAL(36, 18),
      allowNull: false,
      comment: 'Số tiền đã phân phối (ETH)'
    },

    tx_hash: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Transaction hash trên blockchain'
    },

    block_number: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Block number của transaction'
    },

    status: {
      type: DataTypes.ENUM('PENDING', 'SUCCESS', 'FAILED'),
      defaultValue: 'PENDING'
    },

    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    }

  }, {
    tableName: 'tournament_distributions',
    timestamps: true,
  });

  TournamentDistribution.associate = (models) => {
    TournamentDistribution.belongsTo(models.Tournament, {
      foreignKey: 'tournament_id',
      as: 'tournament'
    });
  };

  return TournamentDistribution;
};
