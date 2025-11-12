'use strict';
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Team = sequelize.define('Team', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: DataTypes.STRING,
    logo_url: DataTypes.STRING,
    description: DataTypes.TEXT,
    country: DataTypes.STRING,
    wallet_address: DataTypes.STRING,
    private_key: DataTypes.STRING,
    leader_id: DataTypes.INTEGER,
    created_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, { tableName: 'teams' });

  Team.associate = models => {
    Team.belongsTo(models.User, { foreignKey: 'leader_id', as: 'leader' });
    Team.hasMany(models.TeamMember, { foreignKey: 'team_id', as: 'members' });
  };

  return Team;
};
