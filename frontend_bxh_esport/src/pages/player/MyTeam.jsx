import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import teamService from '../../services/teamService';
import { TeamMemberList } from '../../components/team/TeamMemberList';
import Card from '../../components/common/Card';

export const MyTeam = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.teamId) {
      loadTeamData();
    }
  }, [user]);

  const loadTeamData = async () => {
    try {
      const [teamData, membersData] = await Promise.all([
        teamService.getTeamById(user.teamId),
        teamService.getTeamMembers(user.teamId),
      ]);
      setTeam(teamData);
      setMembers(membersData.members || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!team) return <div>Bạn chưa tham gia đội nào</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Đội của tôi</h1>
      
      <Card>
        <div className="flex items-center gap-4 mb-6">
          <img
            src={team.logo || '/default-team.png'}
            alt={team.name}
            className="w-20 h-20 rounded-lg object-cover"
          />
          <div>
            <h2 className="text-2xl font-bold text-white">{team.name}</h2>
            <p className="text-gray-400">{team.region}</p>
          </div>
        </div>
        <p className="text-gray-300">{team.description}</p>
      </Card>

      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Thành viên</h3>
        <TeamMemberList members={members} canManage={false} />
      </div>
    </div>
  );
};
