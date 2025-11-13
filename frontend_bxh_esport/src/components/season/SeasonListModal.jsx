import { useState, useEffect } from 'react';
import { getSeasonsByGameId, deleteSeason } from '../../services/seasonService';
import { useNotification } from '../../context/NotificationContext';
import EditSeasonModal from './EditSeasonModal';
import CreateSeasonModal from './CreateSeasonModal';
import { Card } from '../common/Card';
import { Loading } from '../common/Loading';
import Button from '../common/Button';

export default function SeasonListModal({ game, allGames, onClose, onUpdate }) {
  const [seasons, setSeasons] = useState([]);
  const [filteredSeasons, setFilteredSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (game?.id) {
      loadSeasons();
    }
  }, [game]);

  useEffect(() => {
    filterSeasons();
  }, [seasons, searchTerm, filterStatus]);

  const loadSeasons = async () => {
    try {
      setLoading(true);
      const response = await getSeasonsByGameId(game.id);
      const seasons = response?.data || [];
      setSeasons(seasons);
    } catch (error) {
      showError('Không thể tải danh sách mùa giải');
    } finally {
      setLoading(false);
    }
  };

  const filterSeasons = () => {
    let filtered = [...seasons];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(season => season.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(season =>
        season.season_name?.toLowerCase().includes(searchLower) ||
        season.description?.toLowerCase().includes(searchLower) ||
        season.id?.toString().includes(searchLower)
      );
    }

    setFilteredSeasons(filtered);
  };

  const handleEditClick = (season) => {
    setSelectedSeason(season);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedSeason(null);
    loadSeasons();
    if (onUpdate) onUpdate();
  };

  const handleCreateSuccess = (response) => {
    setShowCreateModal(false);
    loadSeasons();
    if (onUpdate) onUpdate();
    if (response?.message) {
      showSuccess(response.message);
    }
  };

  const handleDeleteClick = async (seasonId) => {
    if (!window.confirm('Bạn có chắc muốn xóa mùa giải này?')) {
      return;
    }

    try {
      await deleteSeason(seasonId);
      showSuccess('Xóa mùa giải thành công');
      loadSeasons();
      if (onUpdate) onUpdate();
    } catch (error) {
      showError(error?.message || 'Xóa mùa giải thất bại');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PREPARING: { text: 'Chuẩn bị', color: 'bg-amber-500/30 text-amber-200 border-amber-400/50' },
      IN_PROGRESS: { text: 'Đang diễn ra', color: 'bg-emerald-500/30 text-emerald-200 border-emerald-400/50' },
      FINISHED: { text: 'Đã kết thúc', color: 'bg-blue-500/30 text-blue-200 border-blue-400/50' },
    };
    
    const badge = badges[status] || badges.PREPARING;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border-2 ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <Card className="max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-primary-700/20">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Mùa giải của {game?.game_name}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Quản lý các mùa giải cho game này
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => setShowCreateModal(true)}
              >
                + Thêm Mùa giải
              </Button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          {!loading && seasons.length > 0 && (
            <div className="px-6 pt-6">
              <div className="flex flex-col md:flex-row items-center gap-3 mb-4">
                {/* Search Input */}
                <div className="relative flex-1 w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên mùa giải, mô tả, ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 bg-dark-300 border border-primary-700/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors text-sm"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant={filterStatus === 'all' ? 'primary' : 'ghost'}
                    onClick={() => setFilterStatus('all')}
                  >
                    Tất cả
                  </Button>
                  <Button 
                    size="sm" 
                    variant={filterStatus === 'PREPARING' ? 'secondary' : 'ghost'}
                    onClick={() => setFilterStatus('PREPARING')}
                  >
                    Chuẩn bị
                  </Button>
                  <Button 
                    size="sm" 
                    variant={filterStatus === 'IN_PROGRESS' ? 'success' : 'ghost'}
                    onClick={() => setFilterStatus('IN_PROGRESS')}
                  >
                    Đang diễn ra
                  </Button>
                  <Button 
                    size="sm" 
                    variant={filterStatus === 'FINISHED' ? 'ghost' : 'ghost'}
                    onClick={() => setFilterStatus('FINISHED')}
                  >
                    Kết thúc
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {loading && <Loading size="lg" text="Đang tải danh sách mùa giải..." />}

            {!loading && seasons.length === 0 && (
              <div className="py-12 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-cyan-500/10 flex items-center justify-center">
                  <span className="text-4xl">📅</span>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  Chưa có mùa giải nào
                </h3>
                <p className="text-gray-400">
                  Hãy tạo mùa giải đầu tiên cho game này
                </p>
              </div>
            )}

            {!loading && seasons.length > 0 && (
              <>
                {filteredSeasons.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-cyan-500/10 flex items-center justify-center">
                      <svg className="w-10 h-10 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      Không tìm thấy mùa giải nào
                    </h3>
                    <p className="text-gray-400">
                      {searchTerm 
                        ? `Không có kết quả cho "${searchTerm}"`
                        : 'Không có mùa giải nào với bộ lọc này'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-primary-700/20">
                      <thead className="bg-dark-300">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Tên Mùa giải
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Thời gian
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Trạng thái
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-primary-700/20">
                        {filteredSeasons.map((season) => (
                      <tr key={season.id} className="hover:bg-dark-300/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          #{season.id}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-white">
                              {season.season_name}
                            </div>
                            {season.description && (
                              <div className="text-xs text-gray-400 mt-1 line-clamp-1">
                                {season.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          <div className="flex flex-col gap-1">
                            <div>🟢 {formatDate(season.start_date)}</div>
                            <div>🔴 {formatDate(season.end_date)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(season.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditClick(season)}
                              className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 font-semibold hover:bg-emerald-500/30 rounded-lg transition-colors border border-emerald-500/30"
                              title="Chỉnh sửa"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteClick(season.id)}
                              className="px-3 py-1.5 bg-rose-500/20 text-rose-300 font-semibold hover:bg-rose-500/30 rounded-lg transition-colors border border-rose-500/30"
                              title="Xóa"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t border-primary-700/20">
            <div className="text-sm text-gray-400">
              {searchTerm || filterStatus !== 'all' 
                ? `Hiển thị ${filteredSeasons.length} / ${seasons.length} mùa giải`
                : `Tổng: ${seasons.length} mùa giải`
              }
            </div>
            <Button variant="secondary" size="md" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </Card>
      </div>

      {/* Create Season Modal */}
      {showCreateModal && (
        <CreateSeasonModal
          games={[game]}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Edit Season Modal */}
      {showEditModal && selectedSeason && (
        <EditSeasonModal
          season={selectedSeason}
          games={allGames}
          onClose={() => {
            setShowEditModal(false);
            setSelectedSeason(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}
