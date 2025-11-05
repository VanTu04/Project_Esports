import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import matchService from '../../services/matchService';
import { MatchSchedule as MatchScheduleComp } from '../../components/tournament/MatchSchedule';

export const PlayerMatchSchedule = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.teamId) {
      loadMatches();
    }
  }, [user]);

  const loadMatches = async () => {
    try {
      const data = await matchService.getMatchesByTeam(user.teamId);
      setMatches(data.matches || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Lịch thi đấu</h1>
      <MatchScheduleComp matches={matches} loading={loading} />
    </div>
  );
};

