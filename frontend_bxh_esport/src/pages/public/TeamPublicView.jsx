import { useEffect, useState } from 'react';
import PublicLayout from '../../components/layout/PublicLayout';
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
      const response = await teamService.getAllTeams();
      console.log('API Response:', response);
      
      // Handle different response structures
      const data = response?.data?.data || response?.data || response;
      const teamsList = data.teams || data || [];
      
      console.log('Teams list:', teamsList);
      setTeams(teamsList);
    } catch (error) {
      console.error('Load teams error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-screen bg-[#0e0e0e] text-white flex flex-col">
        <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Đội tuyển</h1>
          <TeamList teams={teams} loading={loading} />
        </div>
        </main>
      </div>
    </PublicLayout>
  );
};
