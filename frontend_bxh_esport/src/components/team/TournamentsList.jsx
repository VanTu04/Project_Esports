import React, { useEffect, useState } from 'react';
import { Calendar, Trophy } from 'lucide-react';
import { normalizeImageUrl } from '../../utils/imageHelpers';
import { TournamentCard } from '../tournament/TournamentCard';
import tournamentService from '../../services/tournamentService';

const TournamentsList = ({ tournaments = [] }) => {
  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="bg-gray-800/30 rounded-2xl p-12 border border-gray-700/50 text-center">
        <Trophy className="w-16 h-16 text-gray-700 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">Chưa tham gia giải đấu nào.</p>
      </div>
    );
  }

  // Only consider tournaments where this team actually has a participant entry
  const teamTournaments = tournaments.filter(t => {
    const parts = t.participants || t.Participants || t.participant || [];
    return Array.isArray(parts) ? parts.length > 0 : Boolean(parts);
  });

  const [resolvedTournaments, setResolvedTournaments] = useState(null);

  useEffect(() => {
    let mounted = true;
    // Enrich participant entries that don't contain tournament details
    (async () => {
      try {
        const list = teamTournaments || [];
        // find entries that look like participant records (no name/title)
        const needs = list.filter(t => !(t.name || t.tournament_name || t.title));
        if (needs.length === 0) {
          if (mounted) setResolvedTournaments(list);
          return;
        }

        const fetches = needs.map(p => {
          const tid = p.tournament_id || p.tournamentId || (p.tournament && (p.tournament.id || p.tournament.tournament_id));
          if (!tid) return Promise.resolve({ status: 'rejected', reason: 'no-id', value: p });
          return tournamentService.getTournamentById(tid).then(r => ({ status: 'fulfilled', value: (r?.data?.data || r?.data || r) })).catch(e => ({ status: 'rejected', reason: e, value: p }));
        });

        const results = await Promise.all(fetches);
        const fetchedMap = {};
        results.forEach((res, idx) => {
          const original = needs[idx];
          const tid = original.tournament_id || original.tournamentId || (original.tournament && (original.tournament.id || original.tournament.tournament_id));
          if (res && res.status === 'fulfilled' && res.value) {
            const data = Array.isArray(res.value) ? res.value[0] : (res.value?.data ?? res.value);
            fetchedMap[tid] = data || res.value;
          }
        });

        const merged = list.map(item => {
          if (item.name || item.tournament_name || item.title) return item;
          const tid = item.tournament_id || item.tournamentId || (item.tournament && (item.tournament.id || item.tournament.tournament_id));
          return fetchedMap[tid] || item;
        });

        if (mounted) setResolvedTournaments(merged);
      } catch (e) {
        if (mounted) setResolvedTournaments(teamTournaments);
      }
    })();
    return () => { mounted = false; };
  }, [tournaments]);

  // We'll compute ongoing/finished from whatever list we're rendering:
  // prefer resolvedTournaments (enriched), otherwise fall back to teamTournaments.
  const now = new Date();
  const listToUse = resolvedTournaments ?? teamTournaments;

  const ongoing = (listToUse || []).filter(t => {
    try {
      if (t.status && String(t.status).toUpperCase() === 'COMPLETED') return false;
      const end = t.end_date || t.endDate || t.end_time ? new Date(t.end_date || t.endDate || t.end_time) : null;
      if (end && end < now) return false;
      return true;
    } catch (e) { return true; }
  });

  const finished = (listToUse || []).filter(t => {
    try {
      if (t.status && String(t.status).toUpperCase() === 'COMPLETED') return true;
      const end = t.end_date || t.endDate || t.end_time ? new Date(t.end_date || t.endDate || t.end_time) : null;
      if (end && end < now) return true;
      return false;
    } catch (e) { return false; }
  });

  const renderCards = (list) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {list.map((t) => (
        <TournamentCard key={t.id || t.tournament_id || t.tournament?.id} tournament={t} />
      ))}
    </div>
  );

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
