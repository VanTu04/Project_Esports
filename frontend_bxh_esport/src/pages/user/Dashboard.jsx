import { TournamentList } from '../../components/tournament/TournamentList';
import { useEffect, useState } from 'react';
import tournamentService from '../../services/tournamentService';

export const UserDashboard = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const data = await tournamentService.getFeaturedTournaments();
      setTournaments(data.tournaments || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">User Dashboard</h1>
      
      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">Giải đấu nổi bật</h2>
        <TournamentList tournaments={tournaments} loading={loading} />
      </section>
    </div>
  );
};