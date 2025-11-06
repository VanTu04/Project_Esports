import { useEffect, useState } from 'react';
import tournamentService from '../../services/tournamentService';
import { TournamentList } from '../../components/tournament/TournamentList';
import Button from '../../components/common/Button';

export const TournamentRegistration = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const data = await tournamentService.getUpcomingTournaments();
      setTournaments(data.tournaments || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Đăng ký giải đấu</h1>
      <TournamentList tournaments={tournaments} loading={loading} />
    </div>
  );
};

