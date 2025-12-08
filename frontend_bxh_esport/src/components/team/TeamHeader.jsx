import React, { useState, useMemo } from 'react';
import { normalizeImageUrl } from '../../utils/imageHelpers';
import { Edit, Heart, UserCheck, Users, Trophy, Calendar } from 'lucide-react';
import { THEME_COLORS } from '../../utils/constants';
import { Card } from '../common/Card';
import Button from '../common/Button';

const TeamHeader = ({ 
  team, 
  members = [],
  tournaments = [],
  onEdit, 
  onShowFollowers, 
  onShowFollowing, 
  onToggleFavorite, 
  isFavorite,
  isPublicMode = false
}) => {
  const stats = {
    totalMatches: team?.total_matches || 0,
    wins: team?.wins || 0,
    losses: team?.losses || 0,
    winRate: team?.total_matches > 0 
      ? ((team.wins / team.total_matches) * 100).toFixed(0) 
      : 0
  };

  return (
    <div className="bg-gradient-to-br from-yellow-900/20 via-gray-900 to-black rounded-2xl overflow-hidden mb-8 shadow-2xl" style={{
      borderWidth: '2px',
      borderColor: THEME_COLORS.primary,
      boxShadow: `0 20px 50px -12px ${THEME_COLORS.primary}40`
    }}>
      <div className="p-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Team Avatar */}
          <div className="relative">
            {team.avatar ? (
              <img 
                src={normalizeImageUrl(team.avatar)} 
                alt={team.team_name || team.name}
                className="w-40 h-40 rounded-2xl object-cover border-4 shadow-2xl shadow-primary-500/20"
                style={{ borderColor: THEME_COLORS.primary }}
              />
            ) : (
              <div className="w-40 h-40 rounded-2xl bg-gradient-to-br border-4 flex items-center justify-center shadow-2xl shadow-primary-500/20" style={{ 
                borderColor: THEME_COLORS.primary,
                background: `linear-gradient(135deg, ${THEME_COLORS.primary}40, ${THEME_COLORS.primaryDark}40)`
              }}>
                <span className="text-6xl font-bold text-primary-400">
                  {(team.team_name || team.name)?.charAt(0)?.toUpperCase() || 'T'}
                </span>
              </div>
            )}
          </div>

          {/* Team Info */}
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-3 bg-clip-text text-transparent" style={{
              backgroundImage: `linear-gradient(135deg, ${THEME_COLORS.primary}, ${THEME_COLORS.primaryLight})`
            }}>
              {team.team_name || team.name}
            </h1>
            
            <p className="text-gray-300 text-lg mb-4 leading-relaxed">
              {team.description || 'Chưa có mô tả'}
            </p>

            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-2 text-gray-300 hover:text-primary-400 transition-colors">
                <Users className="w-5 h-5" style={{ color: THEME_COLORS.secondary }} />
                <span>{members?.length || 0} thành viên</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300 hover:text-primary-400 transition-colors">
                <Trophy className="w-5 h-5" style={{ color: THEME_COLORS.warning }} />
                <span>{tournaments?.length || 0} giải đấu</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300 hover:text-primary-400 transition-colors">
                <Calendar className="w-5 h-5" style={{ color: THEME_COLORS.primary }} />
                <span>Tham gia {new Date(team.created_at).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300 cursor-pointer hover:text-pink-400 transition-colors" onClick={onShowFollowers}>
                <Heart className="w-5 h-5" style={{ color: THEME_COLORS.live }} />
                <span>{team.followers || 0} followers</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300 cursor-pointer hover:text-green-400 transition-colors" onClick={onShowFollowing}>
                <UserCheck className="w-5 h-5" style={{ color: THEME_COLORS.success }} />
                <span>{team.following || 0} following</span>
              </div>
            </div>

            <div className="flex gap-3">
              {isPublicMode ? (
                onToggleFavorite && (
                  <Button 
                    onClick={onToggleFavorite}
                    variant={isFavorite ? "secondary" : "primary"}
                    leftIcon={isFavorite ? <UserCheck className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
                    className="shadow-lg hover:shadow-xl transition-shadow"
                    style={{ boxShadow: isFavorite ? `0 4px 14px ${THEME_COLORS.secondary}60` : `0 4px 14px ${THEME_COLORS.primary}60` }}
                  >
                    {isFavorite ? 'Đang theo dõi' : 'Theo dõi đội'}
                  </Button>
                )
              ) : (
                onEdit && (
                  <Button 
                    onClick={onEdit}
                    variant="secondary"
                    leftIcon={<Edit className="w-4 h-4" />}
                    className="shadow-lg hover:shadow-xl transition-shadow"
                    style={{ boxShadow: `0 4px 14px ${THEME_COLORS.secondary}60` }}
                  >
                    Chỉnh sửa thông tin
                  </Button>
                )
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 text-center bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-500/30 hover:shadow-lg hover:shadow-green-500/20 transition-all">
              <div className="text-3xl font-bold mb-1" style={{ color: THEME_COLORS.success }}>{stats.wins}</div>
              <div className="text-xs text-gray-400">Thắng</div>
            </Card>
            <Card className="p-4 text-center bg-gradient-to-br from-red-900/30 to-red-800/20 border border-red-500/30 hover:shadow-lg hover:shadow-red-500/20 transition-all">
              <div className="text-3xl font-bold mb-1" style={{ color: THEME_COLORS.error }}>{stats.losses}</div>
              <div className="text-xs text-gray-400">Thua</div>
            </Card>
            <Card className="p-4 text-center bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border border-yellow-500/30 col-span-2 hover:shadow-lg hover:shadow-yellow-500/20 transition-all">
              <div className="text-3xl font-bold mb-1" style={{ color: THEME_COLORS.primary }}>{stats.winRate}%</div>
              <div className="text-xs text-gray-400">Tỷ lệ thắng</div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamHeader;
