import React, { useEffect, useState } from 'react';
import { Card } from '../common/Card';
import Button from '../common/Button';
import { resolveTeamLogo } from '../../utils/imageHelpers';
import tournamentService from '../../services/tournamentService';

const TournamentMatches = ({
  groupedMatchesMap,
  selectedRound,
  setSelectedRound,
  tournament,
  isTeamView,
  isAdmin,
  getMatchStatusBadge,
  handleOpenTimeModal,
  handleOpenScoreModal,
  findTeamLogo,
  handleStartNewRound,
  creatingRound,
  // props added for inline record / modal open
  handleRecordRanking,
  isRecording,
  openCreateRoundModal,
}) => {
  const [participantLogos, setParticipantLogos] = useState({});

  // Normalize tournament done state here so rendering logic below is consistent
  const _tStatus = (tournament?.status || '').toString().toUpperCase();
  const tournamentDone = ['DONE', 'COMPLETED'].includes(_tStatus);

  // Compute whether the currently selected round is fully DONE, and whether all rounds are DONE
  const selectedRoundMatches = groupedMatchesMap[selectedRound] || [];
  const selectedRoundDone = selectedRoundMatches.length > 0 && selectedRoundMatches.every(m => (m?.status || '').toString().toUpperCase() === 'DONE');
  const allMatches = Object.values(groupedMatchesMap).flat();
  const allRoundsDone = allMatches.length > 0 && allMatches.every(m => (m?.status || '').toString().toUpperCase() === 'DONE');

  useEffect(() => {
    let mounted = true;
    const loadParticipants = async () => {
      try {
        if (!tournament || !tournament.id) return;
        const resp = await tournamentService.getParticipants(tournament.id);
        const parts = resp?.data ?? [];
        const map = {};
        parts.forEach(p => {
          if (!p) return;
          const id = p.id || p.participant_id || p.participantId;
          if (!id) return;
          // Prefer server-provided `logo_url` then `avatar` then nested user.avatar
          map[id] = p.logo_url || p.avatar || (p.user && p.user.avatar) || (p.team && p.team.avatar) || null;
        });
        if (mounted) setParticipantLogos(map);
      } catch (err) {
        // ignore - non-fatal
        console.warn('Could not load participants for logos', err && err.message);
      }
    };

    loadParticipants();
    return () => { mounted = false; };
  }, [tournament?.id]);


  return (
    <div className="space-y-6">
      {Object.keys(groupedMatchesMap).length === 0 ? (
        <Card padding="lg" className="text-center text-gray-300">Chưa có trận đấu</Card>
      ) : (
        <Card padding="lg">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {Object.keys(groupedMatchesMap).sort((a,b)=>a-b).map(r => (
                <button
                  key={r}
                  onClick={() => setSelectedRound(Number(r))}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${selectedRound === Number(r) ? 'bg-cyan-300 text-dark-900' : 'bg-transparent text-gray-300 border border-primary-700/20'}`}
                >
                  Vòng {r}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {/* Create next round OR Record leaderboard button aligned with the round selectors */}
              {isAdmin && allRoundsDone ? (
                // Show record-ranking when tournament is finished (accept DONE or COMPLETED)
                (tournament?.leaderboard_saved === 1) ? (
                  <Button size="sm" variant="secondary" disabled>
                    Đã ghi bảng xếp hạng
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => typeof handleRecordRanking === 'function' ? handleRecordRanking() : null}
                    disabled={!!isRecording}
                  >
                    {isRecording ? 'Đang ghi...' : 'Ghi bảng xếp hạng'}
                  </Button>
                )
              ) : (
                // Show create-next-round only when selected round is NOT fully DONE
                isAdmin && !selectedRoundDone && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => typeof openCreateRoundModal === 'function' ? openCreateRoundModal() : handleStartNewRound()}
                    disabled={!!creatingRound}
                  >
                    {creatingRound ? 'Đang tạo...' : 'Tạo vòng tiếp theo'}
                  </Button>
                )
              )}
            </div>
          </div>

          <div className="space-y-3">
            {(groupedMatchesMap[selectedRound] || []).map(match => {
              const scoreA = match.score_team_a ?? match.score_a ?? match.score1 ?? null;
              const scoreB = match.score_team_b ?? match.score_b ?? match.score2 ?? null;
              // determine whether scheduled time has been reached/passed
              const scheduledReachedFromTime = match.match_time ? (new Date(match.match_time).getTime() <= Date.now()) : false;
              const scheduledReached = !!match.__scheduledReached || scheduledReachedFromTime;
              return (
                <div key={match.id} className="rounded-lg p-4 border border-primary-500/30 bg-primary-500/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-300 text-sm">{match.match_time ? new Date(match.match_time).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'}) : 'Chưa có lịch'}</span>
                    {(() => getMatchStatusBadge(match.status || 'PENDING'))()}
                  </div>

                  {match.team_b_participant_id ? (
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <div className="flex-1 flex items-center justify-end gap-3 text-right">
                        {(() => {
                          // If we have a participant logo map, prefer it (no backend changes required)
                          const participantLogoA = participantLogos[match.team_a_participant_id] || participantLogos[match.teamA?.id] || null;
                          const maybe = {
                            // Prefer participant map, then canonical server-provided `teamA.logo_url`, then other fields
                            logo_url: participantLogoA || match.teamA?.logo_url || match.team_a_logo || match.teamA?.logo || match.team_a_avatar || match.teamA?.avatar || match.logo_a || null,
                            logo: participantLogoA || match.teamA?.logo_url || match.team_a_logo || match.teamA?.logo || match.team_a_avatar || match.teamA?.avatar || match.logo_a || null,
                            avatar: participantLogoA || match.teamA?.team?.avatar || match.team_a_avatar || match.teamA?.avatar || null,
                            name: match.team_a_name || match.teamA?.name || match.teamA?.team_name || 'TBD'
                          };
                          const rawA = typeof findTeamLogo === 'function' ? findTeamLogo(maybe) : (maybe.logo_url || maybe.logo || maybe.avatar);
                          const logoA = resolveTeamLogo(typeof rawA === 'string' ? { logo: rawA } : maybe);
                          return (
                            <>
                              <div className="flex flex-col items-end">
                                <div className="text-lg font-bold text-white">{maybe.name}</div>
                                <div className="text-sm text-green-400 mt-1">{match.point_team_a != null ? `+${match.point_team_a}` : ''}</div>
                              </div>
                              {logoA && (
                                    <img src={logoA} alt="logo" className="w-8 h-8 rounded-full ml-2 object-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; }} />
                                  )}
                            </>
                          );
                        })()}
                      </div>

                      <div className="flex flex-col items-center px-6">
                        <div className="text-2xl font-extrabold text-white flex items-center gap-3">
                          <span className="text-cyan-300 text-3xl">{scoreA != null ? scoreA : '-'}</span>
                          <span className="text-gray-400">/</span>
                          <span className="text-yellow-300 text-3xl">{scoreB != null ? scoreB : '-'}</span>
                        </div>
                      </div>

                      <div className="flex-1 flex items-center justify-start gap-3 text-left">
                        {(() => {
                          const participantLogoB = participantLogos[match.team_b_participant_id] || participantLogos[match.teamB?.id] || null;
                          const maybe = {
                            // Prefer participant map, then canonical server-provided `teamB.logo_url`, then other fields
                            logo_url: participantLogoB || match.teamB?.logo_url || match.team_b_logo || match.teamB?.logo || match.team_b_avatar || match.teamB?.avatar || match.logo_b || null,
                            logo: participantLogoB || match.teamB?.logo_url || match.team_b_logo || match.teamB?.logo || match.team_b_avatar || match.teamB?.avatar || match.logo_b || null,
                            avatar: participantLogoB || match.teamB?.team?.avatar || match.team_b_avatar || match.teamB?.avatar || null,
                            name: match.team_b_name || match.teamB?.name || match.teamB?.team_name || 'TBD'
                          };
                          const rawB = typeof findTeamLogo === 'function' ? findTeamLogo(maybe) : (maybe.logo_url || maybe.logo || maybe.avatar);
                          const logoB = resolveTeamLogo(typeof rawB === 'string' ? { logo: rawB } : maybe);
                          return (
                            <>
                              {logoB && (
                                <img src={logoB} alt="logo" className="w-8 h-8 rounded-full mr-2 object-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; }} />
                              )}
                              <div className="flex flex-col items-start">
                                <div className="text-lg font-bold text-white">{maybe.name}</div>
                                <div className="text-sm text-green-400 mt-1">{match.point_team_b != null ? `+${match.point_team_b}` : ''}</div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-4 mb-3">
                      <div className="w-full text-center text-lg font-bold text-white">
                        {match.team_a_name || 'TBD'}
                        <div className="text-sm mt-1 text-green-400">{match.point_team_a != null ? `+${match.point_team_a}` : ''}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center gap-3 mt-2">
                    <div className="flex justify-center gap-3">
                      {(() => {
                        const statusUpper = (match.status || '').toString().toUpperCase();
                        const tournamentDone = ['DONE', 'COMPLETED'].includes((tournament?.status || '').toString().toUpperCase());

                        // Show "Cập nhật thời gian" only for PENDING matches
                        const showUpdateTime = isAdmin && !isTeamView && !tournamentDone && statusUpper === 'PENDING';

                        // Show "Cập nhật kết quả" for admins whenever the match is not DONE/CANCELLED
                        // (user requested to always show the update-result button)
                        const showUpdateResult = isAdmin && !isTeamView && !tournamentDone && !['DONE', 'CANCELLED'].includes(statusUpper) && !!match.team_b_participant_id;

                        return (
                          <>
                            {showUpdateTime && (
                              <Button variant="secondary" size="sm" onClick={() => { console.debug('open time modal', match.id, statusUpper); handleOpenTimeModal(match); }}>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Cập nhật thời gian
                              </Button>
                            )}

                            {showUpdateResult && (
                              <Button variant="primary" size="sm" onClick={() => { console.debug('open score modal', match.id, statusUpper, 'scheduledReached=', scheduledReached); handleOpenScoreModal(match); }} className="text-white">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Cập nhật kết quả
                              </Button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default TournamentMatches;
