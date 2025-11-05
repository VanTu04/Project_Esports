import { useEffect, useState } from 'react';
import teamService from '../../services/teamService';
import { TeamList } from '../../components/team/TeamList';

export const TeamPublicView = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const data = await teamService.getAllTeams();
      setTeams(data.teams || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Đội tuyển</h1>
      <TeamList teams={teams} loading={loading} />
    </div>
  );
};
