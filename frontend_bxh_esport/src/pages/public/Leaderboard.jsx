import { useEffect, useState } from 'react';
import teamService from '../../services/teamService';
import { LeaderboardTable } from '../../components/tournament/LeaderboardTable';

export const Leaderboard = () => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    try {
      const data = await teamService.getTeamRankings();
      setRankings(data.rankings || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Bảng xếp hạng</h1>
      <LeaderboardTable data={rankings} loading={loading} />
    </div>
  );
};
