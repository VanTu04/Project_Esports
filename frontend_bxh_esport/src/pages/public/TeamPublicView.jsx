import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicLayout from '../../components/layout/PublicLayout';
import teamService from '../../services/teamService';
import { TeamList } from '../../components/team/TeamList';
import { normalizeImageUrl } from '../../utils/imageHelpers';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../utils/constants';

export const TeamPublicView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('rank'); // rank, points, wins, winRate, name, matches
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const response = await teamService.getTeamRankings();
      console.log('API Response:', response);
      
      // Handle different response structures
      const data = response?.data?.data || response?.data || response;
      const teamsList = data.teams || data || [];
      
      console.log('Teams list:', teamsList);
      // Chỉ lấy top 50 đội
      setTeams(teamsList.slice(0, 50));
    } catch (error) {
      console.error('Load teams error:', error);
      // Fallback to getAllTeams if rankings endpoint fails
      try {
        const response = await teamService.getAllTeams();
        const data = response?.data?.data || response?.data || response;
        const teamsList = data.teams || data || [];
        setTeams(teamsList.slice(0, 50));
      } catch (fallbackError) {
        console.error('Fallback load teams error:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      // Toggle order if same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to desc (except for 'rank' which defaults to asc)
      setSortBy(column);
      setSortOrder(column === 'rank' ? 'asc' : 'desc');
    }
  };

  const getSortedTeams = () => {
    const sorted = [...teams].sort((a, b) => {
      const totalMatchesA = (a.wins || 0) + (a.losses || 0) + (a.draws || 0);
      const totalMatchesB = (b.wins || 0) + (b.losses || 0) + (b.draws || 0);
      const winRateA = totalMatchesA > 0 ? (a.wins || 0) / totalMatchesA : 0;
      const winRateB = totalMatchesB > 0 ? (b.wins || 0) / totalMatchesB : 0;
      const pointsA = (a.wins || 0) * 3 + (a.draws || 0) * 1;
      const pointsB = (b.wins || 0) * 3 + (b.draws || 0) * 1;

      let compareValue = 0;
      switch (sortBy) {
        case 'rank':
          // Rank is based on default points sorting - recalculate rank on the fly
          compareValue = pointsB - pointsA;
          if (compareValue === 0) compareValue = (b.wins || 0) - (a.wins || 0);
          break;
        case 'points':
          compareValue = pointsB - pointsA;
          break;
        case 'wins':
          compareValue = (b.wins || 0) - (a.wins || 0);
          break;
        case 'winRate':
          compareValue = winRateB - winRateA;
          break;
        case 'matches':
          compareValue = totalMatchesB - totalMatchesA;
          break;
        case 'name':
          compareValue = (a.name || '').localeCompare(b.name || '');
          break;
        default:
          compareValue = pointsB - pointsA;
      }

      return sortOrder === 'asc' ? -compareValue : compareValue;
    });

    return sorted;
  };

  const SortIcon = ({ column }) => {
    if (sortBy !== column) {
      return (
        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-[#0e0e0e] text-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Đang tải...</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-[#0e0e0e] text-white flex flex-col">
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent mb-2">
                Bảng thành tích các đội
              </h1>
              <p className="text-gray-400">Xem thành tích và thống kê của các đội tham gia</p>
            </div>

            {teams.length === 0 ? (
              <div className="text-center py-12 bg-dark-400 rounded-lg border border-primary-500/10">
                <p className="text-gray-400">Chưa có đội nào</p>
              </div>
            ) : (
              <div className="bg-dark-400 rounded-lg border border-primary-500/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-primary-700/20 to-primary-600/10 border-b border-primary-500/20">
                        <th className="px-6 py-4 text-left text-sm font-bold text-white">
                          <button
                            onClick={() => handleSort('rank')}
                            className="flex items-center gap-2 hover:text-primary-400 transition-colors"
                          >
                            Hạng
                            <SortIcon column="rank" />
                          </button>
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-white">
                          <button
                            onClick={() => handleSort('name')}
                            className="flex items-center gap-2 hover:text-primary-400 transition-colors"
                          >
                            Đội
                            <SortIcon column="name" />
                          </button>
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-white">
                          <button
                            onClick={() => handleSort('matches')}
                            className="flex items-center justify-center gap-2 w-full hover:text-primary-400 transition-colors"
                          >
                            Trận đấu
                            <SortIcon column="matches" />
                          </button>
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-white">
                          <button
                            onClick={() => handleSort('wins')}
                            className="flex items-center justify-center gap-2 w-full hover:text-primary-400 transition-colors"
                          >
                            Thắng
                            <SortIcon column="wins" />
                          </button>
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-white">Hòa</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-white">Thua</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-white">
                          <button
                            onClick={() => handleSort('winRate')}
                            className="flex items-center justify-center gap-2 w-full hover:text-primary-400 transition-colors"
                          >
                            Tỷ lệ thắng
                            <SortIcon column="winRate" />
                          </button>
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-white">
                          <button
                            onClick={() => handleSort('points')}
                            className="flex items-center justify-center gap-2 w-full hover:text-primary-400 transition-colors"
                          >
                            Điểm
                            <SortIcon column="points" />
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary-500/10">
                      {getSortedTeams().map((team, index) => {
                        const totalMatches = (team.wins || 0) + (team.losses || 0) + (team.draws || 0);
                        const winRate = totalMatches > 0 ? ((team.wins || 0) / totalMatches * 100).toFixed(1) : '0.0';
                        const points = (team.wins || 0) * 3 + (team.draws || 0) * 1;
                        
                        return (
                          <tr 
                            key={team.id}
                            onClick={() => navigate(user?.role === USER_ROLES.ADMIN ? `/admin/teams/${team.id}` : `/teams/${team.id}`)}
                            className="hover:bg-primary-500/5 transition-colors duration-200 cursor-pointer"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-600/10 border border-primary-500/30">
                                <span className="text-sm font-bold text-primary-400">#{index + 1}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {team.logo_url || team.avatar ? (
                                  <img 
                                    src={normalizeImageUrl(team.logo_url || team.avatar)} 
                                    alt={team.name}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-primary-500/30"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div 
                                  className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-600/10 border-2 border-primary-500/30 flex items-center justify-center"
                                  style={{ display: (team.logo_url || team.avatar) ? 'none' : 'flex' }}
                                >
                                  <span className="text-primary-400 font-bold">
                                    {team.name?.charAt(0)?.toUpperCase() || 'T'}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-semibold text-white">{team.name}</div>
                                  {team.description && (
                                    <div className="text-xs text-gray-400 truncate max-w-xs">
                                      {team.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-sm font-medium text-gray-300">{totalMatches}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-sm font-bold text-green-400">{team.wins || 0}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-sm font-medium text-yellow-400">{team.draws || 0}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-sm font-medium text-red-400">{team.losses || 0}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-16 h-2 bg-dark-600 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
                                    style={{ width: `${winRate}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium text-gray-300 min-w-[3rem]">{winRate}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-gradient-to-r from-primary-500/20 to-primary-600/10 border border-primary-500/30">
                                <span className="text-sm font-bold text-primary-400">{points}</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </PublicLayout>
  );
};
