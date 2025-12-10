import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CalendarIcon, TrophyIcon, UsersIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/helpers';
import { formatETH } from '../../utils/formatters';
import Button from '../common/Button'; 
import Card from '../common/Card'; 
import { useAuth } from '../../context/AuthContext';
import tournamentService from '../../services/tournamentService';
import RegistrationButton from './RegistrationButton';

export const TournamentCard = ({ tournament, compact = false }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // ==========================================
  // 1. LOGIC XỬ LÝ DỮ LIỆU
  // ==========================================
  const [startDate, setStartDate] = useState(tournament?.startDate ?? tournament?.start_date ?? tournament?.start_time ?? null);
  const [endDate, setEndDate] = useState(tournament?.endDate ?? tournament?.end_date ?? tournament?.end_time ?? null);
  
  const normalizeParticipants = (p) => {
    if (Array.isArray(p)) return p.length;
    const n = Number(p);
    return Number.isFinite(n) ? n : 0;
  };

  const normalizePrize = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const calculateTotalPrize = (t) => {
    if (t?.rewards && Array.isArray(t.rewards)) {
      return t.rewards.reduce((sum, reward) => sum + (Number(reward.reward_amount) || 0), 0);
    }
    return t?.prize || t?.prize_pool || t?.prizePool || 0;
  };

  const [participantsCount, setParticipantsCount] = useState(() => normalizeParticipants(tournament?.approved_participants ?? tournament?.participantsCount ?? tournament?.participants_count ?? tournament?.participants));
  const [prize, setPrize] = useState(() => normalizePrize(calculateTotalPrize(tournament)));

  const statusUpper = (tournament?.status || '').toString().toUpperCase();
  const isReadyFlag = tournament?.isReady === 1 || tournament?.is_ready === 1 || tournament?.isReady === true;
  const isRegisterOpen = statusUpper === 'PENDING' && isReadyFlag;
  const isOngoing = statusUpper === 'ACTIVE' && isReadyFlag;
  
  const maxTeams = tournament?.total_team ?? tournament?.max_teams ?? tournament?.maxTeams ?? null;
  const totalTeamsText = tournament?.total_team ?? tournament?.totalTeam ?? maxTeams ?? '-';
  const progressPercent = (maxTeams && Number(maxTeams) > 0) ? (participantsCount / Number(maxTeams)) * 100 : 0;

  const handleCardClick = (e) => {
    if (e.target.closest('button') || e.target.closest('a')) return;
    navigate(`/tournaments/${tournament.id}`);
  };

  const handleRegisterClick = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(`/tournaments/${tournament.id}/register`);
  };

  const handleDetailClick = (e) => {
    e.stopPropagation();
    navigate(`/tournaments/${tournament.id}`);
  }

  // Check if user is a team (role = 3)
  const isTeam = user?.role === 3 || user?.role === '3';

  useEffect(() => {
    const missing = !startDate || !endDate || participantsCount === undefined || participantsCount === null || prize === undefined || prize === null;
    if (!missing) return;
    
    let mounted = true;
    (async () => {
      try {
        if (!tournament?.id) return;
        const resp = await tournamentService.getTournamentById(tournament.id);
        const wrapper = resp?.data ?? resp;
        const data = wrapper?.data ?? wrapper;
        if (!mounted || !data) return;
        
        setStartDate(prev => prev ?? (data.startDate ?? data.start_date ?? data.start_time ?? null));
        setEndDate(prev => prev ?? (data.endDate ?? data.end_date ?? data.end_time ?? null));
        setParticipantsCount(prev => (prev || prev === 0) ? prev : normalizeParticipants(data.approved_participants ?? data.participantsCount ?? data.participants_count ?? data.participants));
        setPrize(prev => (prev || prev === 0) ? prev : normalizePrize(calculateTotalPrize(data)));
      } catch (err) {
        console.debug('TournamentCard: fallback fetch error', err);
      }
    })();
    return () => { mounted = false; };
  }, [tournament, startDate, endDate, participantsCount, prize]);

  // ==========================================
  // 2. GIAO DIỆN COMPACT
  // ==========================================
  if (compact) {
    return (
      <Card 
        hover 
        padding="sm" 
        onClick={handleCardClick}
        className="flex items-center gap-4 cursor-pointer group !bg-gradient-to-br from-dark-400/90 to-dark-500/90 border-primary-500/20 backdrop-blur-sm"
      >
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-dark-600 relative border border-primary-500/20 shadow-lg">
           {tournament?.banner || tournament?.image ? (
              <img
                src={(tournament.banner || tournament.image).startsWith('http') 
                  ? (tournament.banner || tournament.image) 
                  : `${import.meta.env.VITE_API_URL}${tournament.banner || tournament.image}`}
                alt={tournament.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary-500/30">
                <TrophyIcon className="w-6 h-6" />
              </div>
            )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-bold text-white truncate group-hover:text-primary-400 transition-colors mb-1">
            {tournament.name}
          </h4>
          <div className="text-sm text-gray-300 flex items-center gap-3">
             <span className="text-yellow-400 font-semibold flex items-center gap-1">
               <TrophyIcon className="w-4 h-4" />
               {formatETH(prize)} ETH
             </span>
             <span className="w-px h-4 bg-primary-500/30"></span>
             <span className="text-gray-400">{formatDate(startDate, 'dd/MM')}</span>
          </div>
        </div>
      </Card>
    );
  }

  // ==========================================
  // 3. GIAO DIỆN FULL
  // ==========================================
  return (
    <Card 
      hover 
      padding="none" 
      onClick={handleCardClick}
      className="flex flex-col h-full overflow-hidden cursor-pointer group relative !border-primary-500/20 bg-gradient-to-br from-dark-400 to-dark-500 shadow-xl hover:shadow-2xl hover:shadow-primary-500/20 transition-all duration-300"
    >
      {/* --- BANNER SECTION --- */}
      <div className="relative h-40 overflow-hidden bg-dark-600 border-b border-primary-500/20">
        {tournament?.banner || tournament?.image ? (
          <img
            src={(tournament.banner || tournament.image).startsWith('http') 
              ? (tournament.banner || tournament.image) 
              : `${import.meta.env.VITE_API_URL}${tournament.banner || tournament.image}`}
            alt={tournament.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            onError={(e) => { 
              e.target.style.display = 'none'; 
              e.target.parentElement.querySelector('.fallback-icon').style.display = 'flex'; 
            }}
          />
        ) : null}
        
        <div className={`fallback-icon absolute inset-0 flex items-center justify-center bg-dark-600 ${tournament?.banner || tournament?.image ? 'hidden' : 'flex'}`}>
          <TrophyIcon className="w-16 h-16 text-primary-500/30" />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-dark-500 via-dark-500/50 to-transparent" />

        {/* Status Badge */}
        <div className="absolute top-3 right-3 z-10">
          {isRegisterOpen ? (
            <span className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-emerald-600 backdrop-blur-md text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-lg border border-emerald-400/50">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              Đang mở đăng ký
            </span>
          ) : isOngoing ? (
            <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 backdrop-blur-md text-white text-xs font-bold rounded-full shadow-lg border border-red-400/50 animate-pulse">
              Đang diễn ra
            </span>
          ) : (
            <span className="px-3 py-1 bg-gradient-to-r from-gray-600 to-gray-700 backdrop-blur-md text-gray-200 text-xs font-bold rounded-full shadow-lg border border-gray-500/30">
              Đã kết thúc
            </span>
          )}
        </div>
      </div>

      {/* --- CONTENT SECTION --- */}
      <div className="p-4 flex flex-col flex-1">
        
        {/* Title & Date */}
        <div className="mb-4">
          <h3 
            className="text-lg font-bold text-white truncate group-hover:text-primary-400 transition-colors mb-2"
            title={tournament.name || tournament.tournament_name}
          >
            {tournament.name || tournament.tournament_name}
          </h3>
          
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <CalendarIcon className="w-4 h-4 text-primary-400" />
            <span className="font-medium">
              {formatDate(startDate, 'dd/MM/yyyy')} {endDate ? `- ${formatDate(endDate, 'dd/MM/yyyy')}` : ''}
            </span>
          </div>
        </div>

        {/* Info Grid (Prize & Fee) */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Prize */}
          <div className="bg-gradient-to-br from-dark-300/80 to-dark-400/80 rounded-lg p-3 flex items-center gap-2.5 border border-yellow-500/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 flex items-center justify-center flex-shrink-0 border border-yellow-500/30">
              <TrophyIcon className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider mb-0.5">Giải thưởng</p>
              <p className="text-sm font-bold text-yellow-400 truncate">{formatETH(prize)} ETH</p>
            </div>
          </div>

          {/* Fee */}
          <div className="bg-gradient-to-br from-dark-300/80 to-dark-400/80 rounded-lg p-3 flex items-center gap-2.5 border border-blue-500/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center flex-shrink-0 border border-blue-500/30">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider mb-0.5">Phí đăng ký</p>
              <p className="text-sm font-bold text-blue-400 truncate">
                {(tournament.registration_fee && Number(tournament.registration_fee) > 0) ? `${formatETH(tournament.registration_fee)} ETH` : 'Miễn phí'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-auto space-y-3">
          {/* Progress Bar */}
          <div className="bg-dark-300/50 rounded-lg p-3 border border-primary-500/10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-300 flex items-center gap-1.5 font-medium">
                <UsersIcon className="w-4 h-4 text-primary-400" /> Số đội
              </span>
              <span className="text-sm font-bold">
                <span className={progressPercent >= 100 ? "text-green-400" : "text-yellow-400"}>{participantsCount}</span>
                <span className="text-gray-500">/{totalTeamsText}</span>
              </span>
            </div>
            <div className="relative h-2 bg-dark-600 rounded-full overflow-hidden">
              <div 
                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
                  progressPercent >= 100
                    ? 'bg-gradient-to-r from-green-500 to-green-600' 
                    : 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                }`}
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* --- ACTION BUTTONS --- */}
          <div className="grid grid-cols-2 gap-2">
            {/* Nút Chi tiết */}
            <Button 
              variant="ghost" 
              fullWidth={true}
              onClick={handleDetailClick}
              className={`
                py-3 min-h-[40px] font-semibold
                bg-dark-300/50 border border-primary-500/30 text-gray-200
                hover:bg-primary-500/10 hover:border-primary-500/60 hover:text-white
                transition-all duration-300 rounded-lg
                ${(isRegisterOpen && isTeam) ? '' : 'col-span-2'}
              `}
            >
              Xem chi tiết
            </Button>

            {/* Registration Button Component */}
            {isRegisterOpen && isTeam && (
              <RegistrationButton tournament={tournament} isTeamView={true} />
            )}
          </div>

        </div>
      </div>
    </Card>
  );
};