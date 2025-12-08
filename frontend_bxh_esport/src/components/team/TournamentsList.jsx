import React, { useEffect, useState } from 'react';
import { Calendar, Trophy } from 'lucide-react';
import { normalizeImageUrl } from '../../utils/imageHelpers';
import { TournamentCard } from '../tournament/TournamentCard';
import tournamentService from '../../services/tournamentService';

const TournamentsList = ({ tournaments = [] }) => {
  console.log('[TournamentsList] Received tournaments:', tournaments);
  
  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="bg-gray-800/30 rounded-2xl p-12 border border-gray-700/50 text-center">
        <Trophy className="w-16 h-16 text-gray-700 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">Chưa tham gia giải đấu nào.</p>
      </div>
    );
  }

  // Log to check if rank exists
  tournaments.forEach((t, idx) => {
    console.log(`[TournamentsList] Tournament ${idx}:`, {
      id: t.id,
      name: t.name,
      rank: t.rank,
      fullObject: t
    });
  });

  // Only consider tournaments where this team actually has a participant entry
  const teamTournaments = tournaments.filter(t => {
    // If tournament already has name, it's ready to display
    if (t.name || t.tournament_name || t.title) return true;
    // Otherwise check if it has participants
    const parts = t.participants || t.Participants || t.participant || [];
    return Array.isArray(parts) ? parts.length > 0 : Boolean(parts);
  });

  console.log('[TournamentsList] teamTournaments after filter:', teamTournaments);

  // We'll compute ongoing/finished from the tournaments list
  const now = new Date();

  const ongoing = (teamTournaments || []).filter(t => {
    try {
      if (t.status && String(t.status).toUpperCase() === 'COMPLETED') return false;
      const end = t.end_date || t.endDate || t.end_time ? new Date(t.end_date || t.endDate || t.end_time) : null;
      if (end && end < now) return false;
      return true;
    } catch (e) { return true; }
  });

  const finished = (teamTournaments || []).filter(t => {
    try {
      if (t.status && String(t.status).toUpperCase() === 'COMPLETED') return true;
      const end = t.end_date || t.endDate || t.end_time ? new Date(t.end_date || t.endDate || t.end_time) : null;
      if (end && end < now) return true;
      return false;
    } catch (e) { return false; }
  });

  const renderCards = (list) => {
    const formatDate = (date) => {
      if (!date) return '-';
      try {
        return new Date(date).toLocaleDateString('vi-VN');
      } catch {
        return '-';
      }
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {list.map((t) => {
          const tournamentData = t.tournament || t;
          
          const name = tournamentData.name || tournamentData.tournament_name || tournamentData.title || 'Giải đấu';
          const image = normalizeImageUrl(tournamentData.banner || tournamentData.image || tournamentData.logo);
          const startDate = tournamentData.start_date || tournamentData.startDate || tournamentData.start_time;
          const endDate = tournamentData.end_date || tournamentData.endDate || tournamentData.end_time;
          const status = tournamentData.status || t.status;
          
          // Chỉ hiển thị rank cho giải đã kết thúc (COMPLETED)
          const isCompleted = status && String(status).toUpperCase() === 'COMPLETED';
          const rank = isCompleted ? (t.rank || tournamentData.rank) : null;

          console.log(`[TournamentsList] Rendering tournament ${name}:`, {
            status,
            isCompleted,
            tRank: t.rank,
            tournamentDataRank: tournamentData.rank,
            finalRank: rank
          });

          return (
            <div key={t.id || t.tournament_id || t.tournament?.id} className="bg-gray-800/40 rounded-lg border border-gray-700/50 hover:bg-gray-800/60 transition-colors overflow-hidden relative group cursor-pointer">
              {/* Tournament Image */}
              <div className="w-full aspect-square">
                {image ? (
                  <img 
                    src={image} 
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700/50 flex items-center justify-center">
                    <Trophy className="w-16 h-16 text-yellow-500" />
                  </div>
                )}
              </div>
              
              {/* Hover overlay with View Details button */}
              <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <button
                  onClick={() => window.location.href = `/tournaments/${tournamentData.id}`}
                  className="px-6 py-2 bg-transparent border-2 border-yellow-400 hover:bg-yellow-400/10 text-yellow-400 font-semibold rounded-lg transition-all transform scale-95 group-hover:scale-100"
                >
                  Xem chi tiết
                </button>
              </div>
              
              {/* Tournament Info */}
              <div className="p-4 space-y-2">
                <div className="text-white font-semibold text-base line-clamp-2">{name}</div>
                
                <div className="text-gray-400 text-sm flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(startDate)}
                </div>
                
                <div className="text-gray-400 text-sm flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(endDate)}
                </div>
                
                {rank && rank !== '-' && (
                  <div className="text-yellow-400 font-bold text-lg flex items-center gap-1">
                    {rank === 1 && <span className="text-2xl">🥇</span>}
                    {rank === 2 && <span className="text-2xl">🥈</span>}
                    {rank === 3 && <span className="text-2xl">🥉</span>}
                    {rank > 3 && <Trophy className="w-4 h-4" />}
                    Hạng {rank}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white mb-3">Giải đang tham gia</h3>
        {ongoing.length > 0 ? renderCards(ongoing) : <div className="text-gray-400">Không có giải đang tham gia.</div>}
      </div>

      <div>
        <h3 className="text-lg font-bold text-white mb-3">Giải đã tham gia</h3>
        {finished.length > 0 ? renderCards(finished) : <div className="text-gray-400">Chưa tham gia giải nào.</div>}
      </div>
    </div>
  );
};

export default TournamentsList;
