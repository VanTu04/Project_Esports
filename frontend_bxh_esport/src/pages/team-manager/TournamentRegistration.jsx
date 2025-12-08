import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import tournamentService from '../../services/tournamentService';
import { USER_ROLES, ROUTES } from '../../utils/constants';
import { Card } from '../../components/common/Card';
import { Loading } from '../../components/common/Loading';
import Button from '../../components/common/Button';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../hooks/useAuth';
// registration is handled by RegistrationButton component
import RegistrationButton from '../../components/tournament/RegistrationButton';

export const TournamentRegistration = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registrationStatus, setRegistrationStatus] = useState({}); // {tournamentId: {status: 'PENDING'|'APPROVED'|'REJECTED'}}
  const [activeTab, setActiveTab] = useState('available'); // available, participating, completed
  const { showSuccess, showError, showWarning } = useNotification();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
  // keep readyTournaments in outer scope so it's available for registration status loading
  let readyTournaments = [];

  try {
    setLoading(true);
    // Lấy tất cả giải đấu, bỏ filter status
    const response = await tournamentService.getAllTournaments();

    // Normalize response to an array (API may return different shapes)
    // Backend returns wrapper { code, status, message, data }
    const wrapper = response?.data ?? response;
    const data = wrapper?.data ?? wrapper; // now `data` should be either an object with `tournaments` or an array

    let tournamentList = [];
    if (Array.isArray(data)) {
      tournamentList = data;
    } else if (data && Array.isArray(data.tournaments)) {
      tournamentList = data.tournaments;
    } else if (data && Array.isArray(data.items)) {
      // fallback if backend uses `items` key
      tournamentList = data.items;
    } else {
      // sometimes backend returns the list directly under wrapper.data (single object)
      tournamentList = [];
    }

    // Enrich tournaments with detail (to get fields like `registration_fee` which may not be returned
    // by the list endpoint). This calls GET /tournaments/:id for each tournament and merges the result.
    try {
      const enriched = await Promise.all((tournamentList || []).map(async (t) => {
        try {
          const detailRes = await tournamentService.getTournamentById(t.id);
          // apiClient returns wrapper { code, data, message }
          const payload = detailRes?.data?.data ?? detailRes?.data ?? detailRes;
          const detailed = payload?.data || payload || {};
          return { ...t, ...detailed };
        } catch (e) {
          console.warn(`Failed to fetch details for tournament ${t.id}:`, e);
          return t;
        }
      }));
      // Only show tournaments that are marked as ready (isReady === 1)
      readyTournaments = (enriched || []).filter(t => t?.isReady === 1 || t?.isReady === '1' || t?.isReady === true);
      setTournaments(readyTournaments);
    } catch (e) {
      console.warn('Error enriching tournaments:', e);
      setTournaments(tournamentList || []);
    }

      // Load registration status for current user for each ready tournament using the dedicated endpoint
      if (user?.id && Array.isArray(readyTournaments) && readyTournaments.length > 0) {
        try {
          const statusEntries = await Promise.all(readyTournaments.map(async (t) => {
            try {
              const res = await tournamentService.getMyRegistrationStatus(t.id);
              if (res?.data) {
                const payload = res.data?.data ?? res.data ?? res;
                const registered = payload?.data?.registered ?? payload?.registered ?? (payload?.code === 0 && payload?.data?.participant);
                const participant = payload?.data?.participant ?? payload?.participant ?? (registered ? payload.data.participant : null);
                return [t.id, { status: participant?.status || (registered ? 'PENDING' : null), participant, blockchain: payload?.data?.blockchain ?? payload?.blockchain ?? null }];
              }
              return [t.id, null];
            } catch (e) {
              console.warn(`Failed to fetch registration for tournament ${t.id}:`, e);
              return [t.id, null];
            }
          }));

          const statusMap = Object.fromEntries(statusEntries.filter(([,v]) => v));
          setRegistrationStatus(statusMap);
          console.log('Registration status map loaded (ready tournaments):', statusMap);
        } catch (e) {
          console.warn('Error loading registration statuses in parallel:', e);
        }
      }
  } catch (error) {
    showError('Không thể tải danh sách giải đấu');
  } finally {
    setLoading(false);
  }
};

  const loadRegistrationStatus = async (tournamentList) => {
    if (!user?.id) {
      console.log('No user ID, skipping registration status load');
      return;
    }

    console.log('Loading registration status for user:', user.id);
    const statusMap = {};
    
    // Load participants cho từng tournament (tất cả status, không chỉ APPROVED)
    for (const tournament of tournamentList) {
      try {
        // Không truyền status filter để lấy tất cả participants
        const response = await tournamentService.getParticipants(tournament.id);
        
        console.log(`Tournament ${tournament.id} participants response:`, response);
        
        // Backend trả về: {code: 0, data: [...], message: string}
        let participants = [];
        
        if (response?.code === 0) {
          // Success từ backend
          if (Array.isArray(response.data)) {
            participants = response.data;
          } else if (response.data && Array.isArray(response.data.participants)) {
            participants = response.data.participants;
          }
        } else if (Array.isArray(response)) {
          // Trường hợp backend trả về array trực tiếp (không có wrapper)
          participants = response;
        } else if (response?.data && Array.isArray(response.data)) {
          participants = response.data;
        }
        
        console.log(`Tournament ${tournament.id} participants:`, participants);
        
        // Tìm xem user hiện tại đã đăng ký chưa
        const myParticipation = participants.find(p => p.user_id === user.id);
        
        console.log(`My participation for tournament ${tournament.id}:`, myParticipation);
        
        if (myParticipation) {
          statusMap[tournament.id] = {
            status: myParticipation.status, // PENDING, APPROVED, REJECTED
            participantId: myParticipation.id
          };
        }
      } catch (error) {
        console.warn(`Error loading participants for tournament ${tournament.id}:`, error);
      }
    }

    console.log('Final registration status map:', statusMap);
    setRegistrationStatus(statusMap);
  };

  // Registration is handled by the RegistrationButton component





  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  const formatPrizePool = (amount) => {
    if (!amount) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount);
  };

  // Filter tournaments theo tab
  const getFilteredTournaments = () => {
    // Defensive: ensure `tournaments` is an array
    if (!Array.isArray(tournaments)) return [];
    if (activeTab === 'available') {
      // Giải đấu có thể đăng ký (PENDING) và chưa đăng ký hoặc đang chờ duyệt
      return tournaments.filter(t => 
        t.status === 'PENDING' || 
        (t.status === 'ACTIVE' && registrationStatus[t.id]?.status === 'APPROVED')
      );
    } else if (activeTab === 'participating') {
      // Giải đấu đang tham gia (đã được duyệt và giải đấu đang diễn ra)
      return tournaments.filter(t => 
        registrationStatus[t.id]?.status === 'APPROVED' && t.status === 'ACTIVE'
      );
    } else if (activeTab === 'completed') {
      // Giải đấu đã tham gia và đã kết thúc
      return tournaments.filter(t => 
        registrationStatus[t.id]?.status === 'APPROVED' && t.status === 'COMPLETED'
      );
    }
    return tournaments;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading />
      </div>
    );
  }

  const filteredTournaments = getFilteredTournaments();

  return (

    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Đăng ký Giải đấu</h1>
          <p className="text-sm text-gray-400 mt-1">
            Chọn giải đấu để tham gia. Yêu cầu của bạn sẽ được gửi đến Admin để duyệt.
          </p>
        </div>
        <Button onClick={loadTournaments} variant="secondary">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Làm mới
        </Button>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-primary-700/20 bg-gradient-to-r from-primary-500/5 to-purple-500/5">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('available')}
            className={`pb-4 px-2 border-b-2 font-medium transition-colors ${
              activeTab === 'available'
                ? 'border-cyan-300 text-cyan-300'
                : 'border-transparent text-gray-300 hover:text-cyan-200 hover:border-cyan-400/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Có thể đăng ký</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('participating')}
            className={`pb-4 px-2 border-b-2 font-medium transition-colors ${
              activeTab === 'participating'
                ? 'border-cyan-300 text-cyan-300'
                : 'border-transparent text-gray-300 hover:text-cyan-200 hover:border-cyan-400/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Đang tham gia</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`pb-4 px-2 border-b-2 font-medium transition-colors ${
              activeTab === 'completed'
                ? 'border-cyan-300 text-cyan-300'
                : 'border-transparent text-gray-300 hover:text-cyan-200 hover:border-cyan-400/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Đã tham gia</span>
            </div>
          </button>
        </div>
      </div>

      {/* Tournament List */}
      {filteredTournaments.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-300">Không có giải đấu</h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'available' && 'Hiện tại chưa có giải đấu nào đang mở đăng ký.'}
              {activeTab === 'participating' && 'Bạn chưa tham gia giải đấu nào đang diễn ra.'}
              {activeTab === 'completed' && 'Bạn chưa hoàn thành giải đấu nào.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTournaments.map((tournament) => (
            <Card key={tournament.id} className="hover:border-primary-500/50 transition-all">
              <div className="p-6 space-y-4">
                {/* Tournament Image */}
                {tournament.image && (
                  <div className="w-full h-40 rounded-lg overflow-hidden mb-4">
                    <img
                      src={tournament.image.startsWith('http') ? tournament.image : `${import.meta.env.VITE_API_URL}${tournament.image}`}
                      alt={tournament.tournament_name || tournament.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
                {/* Tournament Header */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {tournament.tournament_name || tournament.name}
                  </h3>
                </div>

                {/* Tournament Info */}
                <div className="space-y-2 text-sm">
            
                  <div className="flex items-center text-gray-300">
                    <svg className="w-4 h-4 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Bắt đầu: {formatDate(tournament.start_date)}</span>
                  </div>

                  <div className="flex items-center text-gray-300">
                    <svg className="w-4 h-4 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Kết thúc: {formatDate(tournament.end_date)}</span>
                  </div>

                  <div className="flex items-center text-yellow-400 font-semibold">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      Phí đăng ký: {tournament.registration_fee != null
                        ? `${tournament.registration_fee} ETH`
                        : formatPrizePool(tournament.prize_pool)}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  {tournament.status === 'ACTIVE' ? (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                      Đã đóng đăng ký
                    </span>
                  ) : tournament.status === 'COMPLETED' ? (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-300 border border-gray-500/30">
                      Đã kết thúc
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Đang mở đăng ký
                    </span>
                  )}
                </div>

                {/* Register Button */}
                {/* View Details button */}
                <Button onClick={() => {
                    if (user && Number(user.role) === USER_ROLES.TEAM_MANAGER) return navigate(`/team-managers/tournaments/${tournament.id}`);
                    if (user && Number(user.role) === USER_ROLES.ADMIN) return navigate(`/admin/tournaments/${tournament.id}`);
                    return navigate(`/tournaments/${tournament.id}`);
                  }} className="w-full mb-3" variant="secondary">
                  Xem chi tiết
                </Button>
                <RegistrationButton tournament={tournament} isTeamView={user && Number(user.role) === USER_ROLES.TEAM_MANAGER} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

