import { useState, useEffect } from 'react';
import { getAllGames } from '../../services/gameService';
import { useNotification } from '../../context/NotificationContext';
import CreateGameModal from '../../components/game/CreateGameModal';
import EditGameModal from '../../components/game/EditGameModal';
import SeasonListModal from '../../components/season/SeasonListModal';
import { Card } from '../../components/common/Card';
import { Loading } from '../../components/common/Loading';
import Button from '../../components/common/Button';

export default function GameManagementPage() {
  const [games, setGames] = useState([]);
  const [allGames, setAllGames] = useState([]); 
  const [filteredGames, setFilteredGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSeasonListModal, setShowSeasonListModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ACTIVE');
  const [searchTerm, setSearchTerm] = useState('');
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    loadGames();
  }, []);

  useEffect(() => {
    filterGames();
  }, [games, filterStatus, searchTerm]);

  const loadGames = async () => {
    try {
      setLoading(true);
      
      // Lấy tất cả games
      const allGamesResponse = await getAllGames(null);
      setAllGames(allGamesResponse?.data || []);
      setGames(allGamesResponse?.data || []);
    } catch (error) {
      showError('Không thể tải danh sách game');
      console.error('Load games error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterGames = () => {
    let filtered = [...games];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(game => game.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(game => 
        game.game_name?.toLowerCase().includes(searchLower) ||
        game.description?.toLowerCase().includes(searchLower) ||
        game.id?.toString().includes(searchLower)
      );
    }

    setFilteredGames(filtered);
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    loadGames();
  };

  const handleEditClick = (game) => {
    setSelectedGame(game);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedGame(null);
    loadGames();
  };

  const handleViewSeasonsClick = (game) => {
    setSelectedGame(game);
    setShowSeasonListModal(true);
  };

  const getStatusBadge = (status) => {
    if (status === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40">
          Hoạt động
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-600/30 text-gray-300 border border-gray-500/40">
        Không hoạt động
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-dark-500 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Quản lý Game</h1>
            <p className="text-sm text-gray-400 mt-1">
              Quản lý danh sách các game esports
            </p>
          </div>
          <Button 
            variant="primary"
            size="md"
            onClick={() => setShowCreateModal(true)}
          >
            Thêm Game Mới
          </Button>
        </div>

        {/* Statistics Cards - Tính từ allGames (tất cả games không filter) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card hover padding="lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Tổng số Game</p>
                <p className="text-2xl font-bold text-white mt-1">{allGames.length}</p>
              </div>
              <div className="p-3 bg-cyan-500/10 rounded-lg">
                <svg className="w-8 h-8 text-cyan-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card hover padding="lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Đang hoạt động</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {allGames.filter(g => g.status === 'ACTIVE').length}
                </p>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <svg className="w-8 h-8 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Card>

          <Card hover padding="lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Không hoạt động</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {allGames.filter(g => g.status === 'INACTIVE').length}
                </p>
              </div>
              <div className="p-3 bg-gray-500/10 rounded-lg">
                <svg className="w-8 h-8 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Search & Filter */}
        <Card padding="lg">
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Search Input */}
            <div className="relative flex-1 w-full md:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên game, mô tả, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-300 border border-primary-700/30 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Filter Buttons */}
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
                variant={filterStatus === 'ACTIVE' ? 'success' : 'ghost'}
                onClick={() => setFilterStatus('ACTIVE')}
              >
                Hoạt động
              </Button>
              <Button 
                size="sm" 
                variant={filterStatus === 'INACTIVE' ? 'secondary' : 'ghost'}
                onClick={() => setFilterStatus('INACTIVE')}
              >
                Không hoạt động
              </Button>
            </div>
          </div>
        </Card>

        {/* Game List */}
        <Card>
          {loading && (
            <Loading size="lg" text="Đang tải danh sách game..." />
          )}

          {!loading && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-primary-700/20">
                <thead className="bg-dark-300">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Tên Game
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Mô tả
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
                  {filteredGames.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-cyan-500/10 flex items-center justify-center">
                          {searchTerm ? (
                            <svg className="w-10 h-10 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          ) : (
                            <span className="text-4xl font-bold text-cyan-300">G</span>
                          )}
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">
                          {searchTerm ? 'Không tìm thấy game nào' : 'Không có game nào'}
                        </h3>
                        <p className="text-gray-400 mb-4">
                          {searchTerm 
                            ? `Không có kết quả cho "${searchTerm}"`
                            : 'Chưa có game nào trong hệ thống'
                          }
                        </p>
                        {!searchTerm && (
                          <Button
                            variant="primary"
                            onClick={() => setShowCreateModal(true)}
                          >
                            Thêm game đầu tiên
                          </Button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredGames.map((game) => (
                      <tr key={game.id} className="hover:bg-dark-300/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          #{game.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">
                            {game.game_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400 max-w-md truncate">
                          {game.description || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(game.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewSeasonsClick(game)}
                              className="px-3 py-1.5 bg-blue-500/20 text-blue-300 font-semibold hover:bg-blue-500/30 rounded-lg transition-colors border border-blue-500/30"
                              title="Quản lý mùa giải"
                            >
                              Mùa giải
                            </button>
                            <button
                              onClick={() => handleEditClick(game)}
                              className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 font-semibold hover:bg-emerald-500/30 rounded-lg transition-colors border border-emerald-500/30"
                              title="Chỉnh sửa game"
                            >
                              Sửa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Modals */}
        {showCreateModal && (
          <CreateGameModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleCreateSuccess}
          />
        )}

        {showEditModal && selectedGame && (
          <EditGameModal
            game={selectedGame}
            onClose={() => {
              setShowEditModal(false);
              setSelectedGame(null);
            }}
            onSuccess={handleEditSuccess}
          />
        )}

        {showSeasonListModal && selectedGame && (
          <SeasonListModal
            game={selectedGame}
            allGames={allGames}
            onClose={() => {
              setShowSeasonListModal(false);
              setSelectedGame(null);
            }}
            onUpdate={loadGames}
          />
        )}
      </div>
    </div>
  );
}
