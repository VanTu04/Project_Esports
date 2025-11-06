import { useEffect, useState } from 'react';
import Card from '../../components/common/Card';
import { TrophyIcon, UsersIcon, FlagIcon } from '@heroicons/react/24/outline';

export const TeamManagerDashboard = () => {
  const [stats, setStats] = useState({
    members: 0,
    tournaments: 0,
    matches: 0,
    wins: 0,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Team Manager Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={UsersIcon} label="Thành viên" value={stats.members} />
        <StatCard icon={TrophyIcon} label="Giải đấu" value={stats.tournaments} />
        <StatCard icon={FlagIcon} label="Trận đấu" value={stats.matches} />
        <StatCard icon={TrophyIcon} label="Trận thắng" value={stats.wins} />
      </div>

      <Card>
        <h2 className="text-xl font-semibold text-white mb-4">Thông báo</h2>
        <div className="text-gray-400">Chưa có thông báo mới</div>
      </Card>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }) => (
  <Card>
    <div className="flex items-center gap-4">
      <div className="p-3 bg-primary-500/10 rounded-lg">
        <Icon className="h-8 w-8 text-primary-500" />
      </div>
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  </Card>
);

