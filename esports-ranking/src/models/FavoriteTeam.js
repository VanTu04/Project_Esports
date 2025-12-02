'use strict';
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const FavoriteTeam = sequelize.define('FavoriteTeam', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    team_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    created_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    timestamps: false,
    tableName: 'favorite_teams',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'team_id']
      }
    ]
  });

  FavoriteTeam.associate = models => {
    FavoriteTeam.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    FavoriteTeam.belongsTo(models.User, { foreignKey: 'team_id', as: 'teamUser' });
  };

  return FavoriteTeam;
};
