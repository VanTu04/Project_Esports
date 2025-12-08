import React, { useState, useMemo } from 'react';
import { resolveTeamLogo } from '../../utils/imageHelpers';
import { Edit, Heart, UserCheck } from 'lucide-react';
import { API_CONFIG } from '../../config';

const TeamHeader = ({ team, onEdit, onShowFollowers, onShowFollowing }) => {
  const stats = {
    winRate: team?.total_matches ? Math.round((team.wins || 0) / team.total_matches * 100) : 0,
    wins: team?.wins || 0,
    losses: team?.losses || 0,
  };

  return (
    <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 rounded-3xl p-8 mb-8 border border-cyan-500/20 overflow-hidden">
      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
        <div className="relative">
          {(() => {
            const avatar = team?.avatar;

            const buildCandidates = (url) => {
              if (!url) return [];
              const candidates = [];
              if (/^https?:\/\//.test(url)) candidates.push(url);
              else {
                // try API base origin
                const base = API_CONFIG?.baseURL || '';
                const origin = base.replace(/\/api\/?$/, '') || '';
                if (origin) candidates.push(`${origin}${url.startsWith('/') ? url : `/${url}`}`);
                // try current origin
                try { candidates.push(`${window.location.origin}${url.startsWith('/') ? url : `/${url}`}`); } catch(e){}
                // finally raw value
                candidates.push(url);
              }
              return candidates;
            };

            // Use centralized resolver
            const src = resolveTeamLogo(team) || null;
            if (!src) return (<div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-2xl flex items-center justify-center text-6xl">🏆</div>);
            return (
              <img src={src} alt={team.team_name || team.name} className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover border-4 border-cyan-500/30" />
            );
          })()}
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
            <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-cyan-400 uppercase tracking-tight">{team.team_name || team.name}</h1>
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-8">
            <div className="text-center"><div className="text-3xl font-bold text-green-400">{stats.winRate}%</div><div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Tỉ lệ thắng</div></div>
            <div className="text-center"><div className="text-3xl font-bold text-white">{team.total_matches || 0}</div><div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Trận đấu</div></div>
            <div className="text-center flex gap-4"><div><div className="text-2xl font-bold text-blue-400">{stats.wins}W</div><div className="text-xs text-gray-500 font-bold">Thắng</div></div><div><div className="text-2xl font-bold text-red-400">{stats.losses}L</div><div className="text-xs text-gray-500 font-bold">Thua</div></div></div>
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={() => onShowFollowers && onShowFollowers()} className="bg-black/20 p-4 rounded-xl border border-white/5 text-center min-w-[100px] hover:bg-white/5 transition-colors" aria-label="Xem followers">
            <Heart className="w-6 h-6 text-pink-500 mx-auto mb-1" />
            <div className="font-bold text-xl">{team.followers || 0}</div>
            <div className="text-[10px] text-gray-400 uppercase">Fans</div>
          </button>
          <button onClick={() => onShowFollowing && onShowFollowing()} className="bg-black/20 p-4 rounded-xl border border-white/5 text-center min-w-[100px] hover:bg-white/5 transition-colors" aria-label="Xem following">
            <UserCheck className="w-6 h-6 text-purple-500 mx-auto mb-1" />
            <div className="font-bold text-xl">{team.following || 0}</div>
            <div className="text-[10px] text-gray-400 uppercase">Following</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamHeader;
