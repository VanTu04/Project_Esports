'use strict';
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const TeamMember = sequelize.define(
    'TeamMember',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

      // team_id trỏ đến users.id (team = user role=3)
      team_id: { type: DataTypes.INTEGER, allowNull: false },

      // Thông tin thành viên
      full_name: { type: DataTypes.STRING, allowNull: true },
      position: { type: DataTypes.STRING, allowNull: true },
      in_game_name: { type: DataTypes.STRING, allowNull: true },
      phone: { type: DataTypes.STRING, allowNull: true },
      email: { type: DataTypes.STRING, allowNull: true },

      status: {
        type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
        defaultValue: 'PENDING',
      },
    },
    { tableName: 'team_members' }
  );

  TeamMember.associate = (models) => {
    // team_id -> users.id
    TeamMember.belongsTo(models.User, {
      foreignKey: 'team_id',
      as: 'team',            // khi gọi include: [{ model: User, as: 'team' }]
      targetKey: 'id'
    });
  };

  return TeamMember;
};
