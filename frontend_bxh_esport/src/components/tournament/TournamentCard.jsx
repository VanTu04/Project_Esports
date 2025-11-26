import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CalendarIcon, TrophyIcon, UsersIcon } from '@heroicons/react/24/outline';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { getStatusColor, getStatusText } from '../../utils/helpers';
import Card from '../common/Card';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import tournamentService from '../../services/tournamentService';

export const TournamentCard = ({ tournament, compact = false }) => {
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
  const [participantsCount, setParticipantsCount] = useState(() => normalizeParticipants(tournament?.participantsCount ?? tournament?.participants_count ?? tournament?.participants));
  const [prize, setPrize] = useState(() => normalizePrize(tournament?.prize ?? tournament?.prize_pool ?? tournament?.prizePool ?? 0));

  // Determine if registration is open: pending status, explicit registration flag, or isReady/is_ready flag
  const statusUpper = (tournament?.status || '').toString().toUpperCase();
  const isReadyFlag = tournament?.isReady === 1 || tournament?.is_ready === 1 || tournament?.isReady === true;
  const isRegisterOpen = statusUpper === 'PENDING' || statusUpper === 'REGISTRATION' || Boolean(tournament?.registration) || isReadyFlag;
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleRegisterClick = (e) => {
    e.preventDefault?.();
    if (!isAuthenticated) {
      // require login
      navigate('/login');
      return;
    }
    navigate(`/tournaments/${tournament.id}/register`);
  };

  const badgeText = isRegisterOpen ? 'Đang mở đăng ký' : getStatusText(tournament.status);
  const badgeClass = isRegisterOpen ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : getStatusColor(tournament.status);

  useEffect(() => {
    // If any important display field is missing, fetch tournament details once
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
        setParticipantsCount(prev => (prev || prev === 0) ? prev : normalizeParticipants(data.participantsCount ?? data.participants_count ?? data.participants));
        setPrize(prev => (prev || prev === 0) ? prev : normalizePrize(data.prize ?? data.prize_pool ?? data.prizePool ?? 0));
      } catch (err) {
        // silent fallback — card will show the best available data from prop
        console.debug('TournamentCard: failed to fetch details', err?.message || err);
      }
    })();
    return () => { mounted = false; };
  }, [tournament, startDate, endDate, participantsCount, prize]);
  return (
    <Card hover className={compact ? 'overflow-hidden p-3' : 'overflow-hidden'}>
      {compact ? (
        // Compact layout for listings (Home) — image removed per request
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white truncate">{tournament.name}</h3>
              <span className={`text-xs font-medium ${badgeClass} px-2 py-0.5 rounded`}>{badgeText}</span>
            </div>

            <div className="text-xs text-gray-400 mt-2 grid grid-cols-1 gap-1">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-gray-400" />
                <span>{formatDate(startDate || tournament.startDate || tournament.start_date, 'dd/MM/yyyy')}{endDate || tournament.endDate || tournament.end_date ? ` — ${formatDate(endDate || tournament.endDate || tournament.end_date, 'dd/MM/yyyy')}` : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-primary-600/10">
                  <TrophyIcon className="w-4 h-4 text-yellow-400" />
                </div>
                <span className="font-medium">{formatCurrency(prize ?? tournament.prize ?? tournament.prize_pool ?? 0, 'VND')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-primary-600/10">
                  <UsersIcon className="w-4 h-4 text-yellow-400" />
                </div>
                <span className="font-medium">{participantsCount ?? tournament.participantsCount ?? tournament.participants_count ?? 0} đội</span>
              </div>
            </div>

            <div className="mt-3">
              {isRegisterOpen ? (
                <Button size="sm" variant="primary" onClick={handleRegisterClick}>
                  Đăng ký
                </Button>
              ) : (
                <Link to={`/tournaments/${tournament.id}`} className={`text-xs px-3 py-1 rounded-md text-white bg-primary-500 hover:bg-primary-600`}>
                  Xem chi tiết
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Full layout: match TournamentRegistration card style */
        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">{tournament.tournament_name || tournament.name}</h3>
          </div>

          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex items-center">
              <CalendarIcon className="w-4 h-4 mr-2 text-green-400" />
              <span>Bắt đầu: {formatDate(startDate || tournament.startDate || tournament.start_date, 'dd/MM/yyyy')}</span>
            </div>

            <div className="flex items-center">
              <CalendarIcon className="w-4 h-4 mr-2 text-red-400" />
              <span>Kết thúc: {formatDate(endDate || tournament.endDate || tournament.end_date, 'dd/MM/yyyy')}</span>
            </div>

            <div className="flex items-center text-yellow-400 font-semibold">
              <TrophyIcon className="w-4 h-4 mr-2" />
              <span>
                Phí đăng ký: {tournament.registration_fee != null ? `${tournament.registration_fee} ETH` : formatCurrency(prize)}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <div className="mb-4">
              {tournament.status === 'ACTIVE' ? (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">Đang diễn ra</span>
              ) : tournament.status === 'COMPLETED' ? (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-300 border border-gray-500/30">Đã kết thúc</span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">Đang mở đăng ký</span>
              )}
            </div>

            <div className="flex flex-col items-stretch gap-3">
              <Button onClick={() => {
                if (user && Number(user.role) === USER_ROLES.TEAM_MANAGER) return navigate(`/team-managers/tournaments/${tournament.id}`);
                if (user && Number(user.role) === USER_ROLES.ADMIN) return navigate(`/admin/tournaments/${tournament.id}`);
                return navigate(`/tournaments/${tournament.id}`);
              }} className="px-4 py-3 w-full text-center" variant="secondary">Xem chi tiết</Button>

              {isRegisterOpen ? (
                <Button onClick={handleRegisterClick} variant="primary" className="px-4 py-3 w-full text-center">Đăng ký ngay</Button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

