'use strict';
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const TeamMember = sequelize.define('TeamMember', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    team_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
      defaultValue: 'PENDING',
    },
  }, { tableName: 'team_members' });

  TeamMember.associate = models => {
    TeamMember.belongsTo(models.Team, { foreignKey: 'team_id', as: 'team' });
    TeamMember.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return TeamMember;
};
