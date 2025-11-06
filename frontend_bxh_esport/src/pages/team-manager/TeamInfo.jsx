import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import teamService from '../../services/teamService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { PencilIcon } from '@heroicons/react/24/outline';

export const TeamInfo = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.teamId) {
      loadTeamInfo();
    }
  }, [user]);

  const loadTeamInfo = async () => {
    try {
      const data = await teamService.getTeamById(user.teamId);
      setTeam(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!team) return <div>Bạn chưa có đội</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Thông tin đội</h1>
        <Button leftIcon={<PencilIcon className="h-5 w-5" />}>
          Chỉnh sửa
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <div className="text-center">
            <img
              src={team.logo || '/default-team.png'}
              alt={team.name}
              className="w-32 h-32 rounded-lg object-cover mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-white">{team.name}</h2>
            <p className="text-gray-400">{team.region}</p>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">Mô tả</h3>
          <p className="text-gray-300">{team.description || 'Chưa có mô tả'}</p>
          
          <div className="mt-6 space-y-3">
            <InfoRow label="Ngày thành lập" value={team.foundedDate} />
            <InfoRow label="Website" value={team.website || 'N/A'} />
            <InfoRow label="Discord" value={team.discord || 'N/A'} />
          </div>
        </Card>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-gray-400">{label}:</span>
    <span className="text-white font-medium">{value}</span>
  </div>
);
