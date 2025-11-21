import { Card } from '../common/Card';
import Button from '../common/Button';
import { useEffect, useState } from 'react';
import tournamentService from '../../services/tournamentService';
import { resolveTeamLogo } from '../../utils/imageHelpers';
import { apiClient } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import { useNotification } from '../../context/NotificationContext';

/**
 * Modal duyệt đội tham gia giải đấu
 * This component fetches pending registrations itself and calls approve/reject APIs.
 */
export const TeamApprovalModal = ({ show, onClose, tournament, pendingTeams: pendingTeamsProp, processingTeamId: processingTeamIdProp, onApprove, onReject }) => {
  const { showSuccess, showError } = useNotification();
  const [pendingTeams, setPendingTeams] = useState(pendingTeamsProp || []);
  const [processingTeamId, setProcessingTeamId] = useState(null);

  // Helper: determine if a participant object represents a waiting approval state
  const isWaitingApproval = (p) => {
    try {
      const status = (p?.status ?? p?.state ?? p?.raw?.status ?? '').toString().toUpperCase();
      return status === 'WAITING_APPROVAL';
    } catch (e) {
      return false;
    }
  };

  const currentApproved = tournament?.teams?.current || 0;
  const minTeams = tournament?.teams?.min || 2;
  const isMinReached = currentApproved >= minTeams;

  useEffect(() => {
    if (!show) return;
    if (!tournament?.id) return;

    // If parent provided pendingTeams, respect that and skip loading
      if (Array.isArray(pendingTeamsProp) && pendingTeamsProp.length > 0) {
        // Strictly filter the incoming list to only WAITING_APPROVAL items. If none match,
        // fall back to loading from the API to ensure we don't hide real pending registrations.
        try {
          const filtered = pendingTeamsProp.filter(isWaitingApproval);
          if (filtered.length > 0) {
            setPendingTeams(filtered);
            return;
          }
        } catch (e) {
          // ignore and fall through to API load
        }
      }

    const load = async () => {
      try {
        // Primary attempt: use the service helper which calls
        // `/tournaments/:id/pending-registrations`.
        let res = null;
        try {
          res = await tournamentService.getPendingRegistrations(tournament.id);
        } catch (e) {
          console.warn('tournamentService.getPendingRegistrations failed, will fallback to direct apiClient call', e);
        }

        // Fallback: call the exact endpoint directly if the service failed or returned unexpected shape
        if (!res) {
          const direct = await apiClient.get(`${API_ENDPOINTS.TOURNAMENTS}/${tournament.id}/pending-registrations`);
          res = direct?.data ?? direct;
        }

        // Debug raw response to help troubleshoot shape issues
        console.debug('getPendingRegistrations response:', res);

        // Normalize several possible response shapes:
        // - axios response: res.data.data.participants
        // - axios response: res.data.participants
        // - direct payload: res.data (array) or res (array)
        let participants = [];
        const payload = res?.data ?? res;
        if (Array.isArray(payload)) {
          participants = payload;
        } else if (Array.isArray(payload?.data)) {
          participants = payload.data;
        } else if (Array.isArray(payload?.data?.participants)) {
          participants = payload.data.participants;
        } else if (Array.isArray(payload?.participants)) {
          participants = payload.participants;
        } else if (Array.isArray(res?.data)) {
          participants = res.data;
        } else {
          // Try common nested locations
          participants = payload?.data?.participants || payload?.participants || payload?.data || [];
        }
        const mapped = participants.map(p => {
          // Prefer backend-normalized `logo_url` or `avatar` fields produced by the controller
          const resolvedLogo = p.logo_url || p.avatar || resolveTeamLogo(p) || p.logo || null;
          return ({
            id: p.id,
            name: p.team_name || p.full_name || `Team ${p.user_id}`,
            captain: (p.User && (p.User.full_name || p.User.username)) || p.full_name || p.username || 'N/A',
            members: p.members || 5,
            registeredDate: p.createdAt || p.created_at,
            description: `Wallet: ${p.wallet_address || p.walletAddress || p.wallet}`,
            logo: resolvedLogo,
            raw: p
          });
        });
        setPendingTeams(mapped);
      } catch (err) {
        console.error('Failed to load pending registrations:', err);
        showError('Không thể tải danh sách chờ duyệt');
      }
    };

    load();
  }, [show, tournament]);

  const handleApprove = async (participantId) => {
    // If parent provided onApprove, delegate the approve action to parent (so it can update table state)
    if (typeof onApprove === 'function') {
      try {
        setProcessingTeamId(participantId);
        await onApprove(participantId);
        // Parent is expected to update pendingTeams via props or you can optimistically remove here
        setPendingTeams(prev => prev.filter(t => t.id !== participantId));
        showSuccess('Duyệt thành công');
      } catch (err) {
        console.error('Approve delegated error:', err);
        showError(err?.message || 'Duyệt thất bại');
      } finally {
        setProcessingTeamId(null);
      }
      return;
    }

    setProcessingTeamId(participantId);
    try {
      const res = await tournamentService.approveParticipant(participantId);
      const participant = res?.data?.participant;
      const blockchain = res?.data?.blockchain;

      setPendingTeams(prev => prev.filter(t => t.id !== participantId));
      showSuccess(res?.message || 'Duyệt thành công');
      if (blockchain) console.log('Blockchain approval info:', blockchain);
    } catch (err) {
      console.error('Approve error:', err);
      showError(err?.message || 'Duyệt thất bại');
    } finally {
      setProcessingTeamId(null);
    }
  };

  const handleReject = async (participantId) => {
    if (!window.confirm('Bạn có chắc muốn từ chối đội này?')) return;

    if (typeof onReject === 'function') {
      try {
        setProcessingTeamId(participantId);
        const reason = prompt('Lý do từ chối (tùy chọn):', 'Không đáp ứng yêu cầu') || null;
        await onReject(participantId, reason);
        setPendingTeams(prev => prev.filter(t => t.id !== participantId));
        showSuccess('Đã từ chối');
      } catch (err) {
        console.error('Reject delegated error:', err);
        showError(err?.message || 'Từ chối thất bại');
      } finally {
        setProcessingTeamId(null);
      }
      return;
    }

    setProcessingTeamId(participantId);
    try {
      const reason = prompt('Lý do từ chối (tùy chọn):', 'Không đáp ứng yêu cầu') || null;
      const res = await tournamentService.rejectParticipant(participantId, reason);
      const participant = res?.data?.participant;
      const blockchain = res?.data?.blockchain;

      setPendingTeams(prev => prev.filter(t => t.id !== participantId));
      showSuccess(res?.message || 'Đã từ chối');
      if (blockchain) console.log('Blockchain reject info:', blockchain);
    } catch (err) {
      console.error('Reject error:', err);
      showError(err?.message || 'Từ chối thất bại');
    } finally {
      setProcessingTeamId(null);
    }
  };

  // Use parent's processing ID if provided
  const effectiveProcessingId = processingTeamIdProp ?? processingTeamId;

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-primary-700/20 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Duyệt Đội Tham Gia</h2>
            <p className="text-sm text-gray-400 mt-1">Giải đấu: {tournament?.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-primary-700/20 rounded-lg transition-colors text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {isMinReached && (
            <div className="mb-4 p-3 rounded-md bg-emerald-600/10 border border-emerald-600/20 text-emerald-300">
              Đã đủ số đội tối thiểu ({minTeams}) để bắt đầu giải. Không thể duyệt thêm đội.
            </div>
          )}

          {pendingTeams.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-400 text-lg">Không có đội nào chờ duyệt</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingTeams.map((team) => (
                <Card key={team.id} hover padding="lg" className="border border-primary-700/30">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div>
                        {team.logo ? (
                          <img
                            src={team.logo}
                            alt={team.name}
                            className="w-12 h-12 rounded-full border-2 border-dark-500 bg-gray-600 object-cover"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-700 border-2 border-dark-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-1">{team.name}</h3>
                        <div className="space-y-1 text-sm text-gray-400">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            <span>Đội trưởng: <span className="text-white">{team.captain}</span></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                            <span>Thành viên: <span className="text-white">{team.members}</span></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            <span>Đăng ký: <span className="text-white">{new Date(team.registeredDate).toLocaleDateString('vi-VN')}</span></span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-300 mt-2">{team.description}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleApprove(team.id)}
                        disabled={effectiveProcessingId === team.id || isMinReached}
                        loading={effectiveProcessingId === team.id}
                      >
                        Duyệt
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleReject(team.id)}
                        disabled={effectiveProcessingId === team.id}
                      >
                        Từ chối
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-primary-700/20 flex justify-end">
          <Button variant="secondary" onClick={onClose}>Đóng</Button>
        </div>
      </Card>
    </div>
  );
};
