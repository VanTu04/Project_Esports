'use strict';
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Wallet = sequelize.define('Wallet', {
    user_id: DataTypes.INTEGER,
    wallet_address: DataTypes.STRING,  // public address MetaMask
    network: DataTypes.STRING,         // ví dụ: Ethereum, Polygon
    balance: DataTypes.DECIMAL(36, 18) // lưu cache số dư
  }, {
    tableName: 'wallets'
  });

  Wallet.associate = models => {
    Wallet.belongsTo(models.User, { foreignKey: 'user_id' });
  };

  return Wallet;
};
