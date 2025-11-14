import { useEffect, useState } from 'react';
import { UsersIcon, UserGroupIcon, TrophyIcon, WalletIcon } from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import { apiClient } from '../../services/api';
import { API_BACKEND } from '../../utils/constants';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeams: 0,
    totalTournaments: 0,
    totalRewards: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      // Try external API (use apiClient so Authorization token is attached); fallback to fake data
      const external = `${API_BACKEND.replace(/\/$/, '')}/admin/stats`;
      try {
        const resp = await apiClient.get(external);
        // apiClient interceptor unwraps wrapper objects; resp may be data or { data }
        const payload = resp?.data ?? resp;
        setStats({
          totalUsers: payload.totalUsers ?? 0,
          totalTeams: payload.totalTeams ?? 0,
          totalTournaments: payload.totalTournaments ?? 0,
          totalRewards: payload.totalRewards ?? 0,
        });
        return;
      } catch (err) {
        console.debug('External stats fetch failed, using fake data:', err?.message || err);
      }

      // Fake data fallback
      setStats({
        totalUsers: 1234,
        totalTeams: 256,
        totalTournaments: 12,
        totalRewards: 48,
      });
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={UsersIcon}
          label="Tổng người dùng"
          value={stats.totalUsers}
          color="blue"
        />
        <StatCard
          icon={UserGroupIcon}
          label="Tổng đội tuyển"
          value={stats.totalTeams}
          color="green"
        />
        <StatCard
          icon={TrophyIcon}
          label="Tổng giải đấu"
          value={stats.totalTournaments}
          color="yellow"
        />
      </div>

      {/* Recent Activities */}
      <Card>
        <h2 className="text-xl font-semibold text-white mb-4">
          Hoạt động gần đây
        </h2>
        <div className="text-gray-400">Đang phát triển...</div>
      </Card>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    yellow: 'bg-yellow-500/10 text-yellow-500',
    purple: 'bg-purple-500/10 text-purple-500',
  };

  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="h-8 w-8" />
        </div>
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    </Card>
  );
};

