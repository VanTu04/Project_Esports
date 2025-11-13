import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import tournamentService from '../../services/tournamentService';
import { Card } from '../../components/common/Card';
import { Loading } from '../../components/common/Loading';
import Button from '../../components/common/Button';
import { useNotification } from '../../context/NotificationContext';

export const MatchManagement = () => {
  const navigate = useNavigate();
  const { showError } = useNotification();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const response = await tournamentService.getAllTournaments();
      const tournamentsData = response?.data || [];
      
      // Map backend status to frontend status
      const mappedTournaments = tournamentsData.map(tournament => {
        let mappedStatus = 'upcoming';
        if (tournament.status === 'ACTIVE') {
          mappedStatus = 'live';
        } else if (tournament.status === 'COMPLETED') {
          mappedStatus = 'completed';
        } else if (tournament.status === 'PENDING') {
          mappedStatus = 'upcoming';
        }
        
        return {
          ...tournament,
          status: mappedStatus,
        };
      });

      setTournaments(mappedTournaments);
    } catch (error) {
      console.error('❌ Failed to load tournaments:', error);
      showError('Không thể tải danh sách giải đấu!');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      live: { text: 'Đang diễn ra', color: 'bg-green-500/30 text-green-300 border-2 border-green-400/50' },
      upcoming: { text: 'Sắp diễn ra', color: 'bg-amber-500/30 text-amber-200 border-2 border-amber-400/50' },
      completed: { text: 'Hoàn thành', color: 'bg-blue-500/30 text-blue-200 border-2 border-blue-400/50' },
    };
    
    const badge = badges[status] || badges.upcoming;
    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const filteredTournaments = tournaments.filter(t => {
    const searchLower = searchTerm.toLowerCase();
    const name = (t.name || '').toLowerCase();
    const description = (t.description || '').toLowerCase();
    return name.includes(searchLower) || description.includes(searchLower);
  });

  return (
    <div className="min-h-screen bg-dark-500 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Quản lý Trận đấu
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Chọn giải đấu để xem và quản lý trận đấu
            </p>
          </div>
        </div>

        {/* Search */}
        <Card padding="lg">
          <input
            type="text"
            placeholder="Tìm kiếm giải đấu..."
            className="w-full px-4 py-2 border border-primary-700/30 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Card>

        {/* Tournament List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading && (
            <div className="col-span-full">
              <Loading size="lg" text="Đang tải danh sách giải đấu..." />
            </div>
          )}

          {!loading && filteredTournaments.length === 0 && (
            <div className="col-span-full">
              <Card padding="lg">
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏆</div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    Không tìm thấy giải đấu
                  </h3>
                  <p className="text-gray-400">
                    {searchTerm ? 'Không có giải đấu phù hợp với tìm kiếm' : 'Chưa có giải đấu nào'}
                  </p>
                </div>
              </Card>
            </div>
          )}

          {!loading && filteredTournaments.map((tournament) => (
            <Card 
              key={tournament.id} 
              padding="lg" 
              hover 
              className="cursor-pointer transition-all duration-200 hover:scale-105"
              onClick={() => navigate(`/admin/tournaments/${tournament.id}/matches`)}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">
                      {tournament.name}
                    </h3>
                    {tournament.description && (
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {tournament.description}
                      </p>
                    )}
                  </div>
                  <div className="ml-3">
                    {getStatusBadge(tournament.status)}
                  </div>
                </div>

                {/* Info */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary-700/20">
                  <div>
                    <p className="text-xs text-gray-400">Vòng hiện tại</p>
                    <p className="text-lg font-bold text-white mt-1">
                      {tournament.current_round || 0} / {tournament.total_rounds || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Trận đấu</p>
                    <p className="text-lg font-bold text-white mt-1">
                      {tournament.matches?.total || 0}
                    </p>
                  </div>
                </div>

                {/* Dates */}
                {tournament.start_date && (
                  <div className="pt-3 border-t border-primary-700/20">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <p className="text-gray-400">Bắt đầu</p>
                        <p className="text-white mt-0.5">
                          {new Date(tournament.start_date).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      {tournament.end_date && (
                        <div className="text-right">
                          <p className="text-gray-400">Kết thúc</p>
                          <p className="text-white mt-0.5">
                            {new Date(tournament.end_date).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/admin/tournaments/${tournament.id}/matches`);
                  }}
                >
                  Xem trận đấu →
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
