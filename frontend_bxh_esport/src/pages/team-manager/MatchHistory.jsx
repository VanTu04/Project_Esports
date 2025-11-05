import { useEffect, useState } from 'react';
import matchService from '../../services/matchService';
import { MatchSchedule } from '../../components/tournament/MatchSchedule';

export const MatchHistory = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const teamId = 1; // Get from context
      const data = await matchService.getMatchesByTeam(teamId);
      setMatches(data.matches || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Lịch sử thi đấu</h1>
      <MatchSchedule matches={matches} loading={loading} />
    </div>
  );
};