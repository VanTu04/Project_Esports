import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import tournamentService from '../../services/tournamentService';
import { USER_ROLES, ROUTES } from '../../utils/constants';
import { Card } from '../../components/common/Card';
import { Loading } from '../../components/common/Loading';
import Button from '../../components/common/Button';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../hooks/useAuth';
import { TournamentCard } from '../../components/tournament/TournamentCard';

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
    <div className="min-h-screen bg-gradient-to-br from-dark-500 via-dark-400 to-dark-500 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
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
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

