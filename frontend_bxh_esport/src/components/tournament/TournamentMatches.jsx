  import React, { useEffect, useState } from 'react';
  import DatePicker from 'react-datepicker';
  import 'react-datepicker/dist/react-datepicker.css';
  import { Card } from '../common/Card';
  import Button from '../common/Button';
  import { resolveTeamLogo } from '../../utils/imageHelpers';
  import { useNotification } from '../../context/NotificationContext';
  import tournamentService from '../../services/tournamentService';

  const TournamentMatches = ({
    groupedMatchesMap,
    selectedRound,
    setSelectedRound,
    tournament,
    isTeamView,
    isAdmin,
    getMatchStatusBadge,
    handleUpdateTime,
    handleUpdateScore,
    findTeamLogo,
    handleStartNewRound,
    creatingRound,
    // props added for inline record / modal open
    handleRecordRanking,
    isRecording,
    showRoundSelector = true,
  }) => {
    const [participantLogos, setParticipantLogos] = useState({});
    const { showError, showSuccess } = useNotification();

    // Modal state moved here from TournamentDetail
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [isUpdateScoreModalOpen, setIsUpdateScoreModalOpen] = useState(false);
    const [isUpdateTimeModalOpen, setIsUpdateTimeModalOpen] = useState(false);
    const [scheduledTime, setScheduledTime] = useState(null);
    const [scoreA, setScoreA] = useState('');
    const [scoreB, setScoreB] = useState('');

    const isByeMatch = (match) => {
      if (!match) return false;
      // Common backend flags
      if (match.is_bye || match.bye || match.walkover || match.isWalkover) return true;
      // Some backends label result_type or code
      if (match.result_type === 'BYE' || match.result === 'BYE') return true;
      // If one side is missing (no participant id), it's a BYE match
      if (!match.team_b_participant_id && (match.team_a_participant_id || match.teamA || match.team_a_name)) return true;
      return false;
    };

    // Normalize tournament done state here so rendering logic below is consistent
    const _tStatus = (tournament?.status || '').toString().toUpperCase();
    const tournamentDone = ['DONE', 'COMPLETED'].includes(_tStatus);

    // Compute whether the currently selected round is fully DONE, and whether all rounds are DONE
    const selectedRoundMatches = groupedMatchesMap[selectedRound] || [];
    const selectedRoundDone = selectedRoundMatches.length > 0 && selectedRoundMatches.every(m => (m?.status || '').toString().toUpperCase() === 'DONE');
    const allMatches = Object.values(groupedMatchesMap).flat();
    const allRoundsDone = allMatches.length > 0 && allMatches.every(m => (m?.status || '').toString().toUpperCase() === 'DONE');

    // Local modal state for creating next round (moved from parent)
    const [showCreateRoundModal, setShowCreateRoundModal] = useState(false);

    // Keep selectedRound in sync with tournament.current_round when tournament changes
    useEffect(() => {
      if (tournament && typeof setSelectedRound === 'function') {
        setSelectedRound(tournament?.current_round || 1);
      }
    }, [tournament, setSelectedRound]);

    const handleOpenTimeModal = (match) => {
      setSelectedMatch(match);
      try {
        const m = match?.match_time ? new Date(match.match_time) : null;
        setScheduledTime(m);
      } catch (e) {
        setScheduledTime(null);
      }
      setIsUpdateTimeModalOpen(true);
    };

    const handleOpenScoreModal = (match) => {
      setSelectedMatch(match);
      setScoreA(match?.score_team_a ?? match?.score_a ?? match?.score1 ?? '');
      setScoreB(match?.score_team_b ?? match?.score_b ?? match?.score2 ?? '');
      setIsUpdateScoreModalOpen(true);
    };

    const handleCloseModals = () => {
      setSelectedMatch(null);
      setIsUpdateScoreModalOpen(false);
      setIsUpdateTimeModalOpen(false);
      setScoreA('');
      setScoreB('');
      setScheduledTime(null);
    };

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
              {showRoundSelector ? (
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
              ) : <div />}

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
                    <>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setShowCreateRoundModal(true)}
                        disabled={!!creatingRound}
                      >
                        {creatingRound ? 'Đang tạo...' : 'Tạo vòng tiếp theo'}
                      </Button>
                      {showCreateRoundModal && (
                        <div className="fixed inset-0 bg-gray-900/70 flex items-center justify-center z-50 p-4">
                          <Card className="w-full max-w-md">
                            <div className="p-6 space-y-4">
                              <h2 className="text-xl font-bold text-white">Xác nhận tạo vòng tiếp theo</h2>
                              <p className="text-gray-300">Sau khi tạo vòng tiếp theo, kết quả các trận ở vòng trước sẽ không thể sửa. Bạn có chắc muốn tiếp tục?</p>
                              <div className="flex gap-3 pt-4">
                                <Button variant="secondary" className="flex-1" onClick={() => setShowCreateRoundModal(false)}>Hủy</Button>
                                <Button variant="primary" className="flex-1" onClick={async () => { setShowCreateRoundModal(false); await handleStartNewRound(); }} disabled={creatingRound}>{creatingRound ? 'Đang tạo...' : 'Xác nhận'}</Button>
                              </div>
                            </div>
                          </Card>
                        </div>
                      )}
                    </>
                  )
                )}
              </div>
            </div>

            <div className="space-y-3">
              {(groupedMatchesMap[selectedRound] || []).map(match => {
                const scoreA = match.score_team_a ?? match.score_a ?? match.score1 ?? null;
                const scoreB = match.score_team_b ?? match.score_b ?? match.score2 ?? null;
                const isBye = isByeMatch(match);
                // determine whether scheduled time has been reached/passed
                const scheduledReachedFromTime = match.match_time ? (new Date(match.match_time).getTime() <= Date.now()) : false;
                const scheduledReached = !!match.__scheduledReached || scheduledReachedFromTime;
                return (
                  <div key={match.id} className="rounded-lg p-4 border border-primary-500/30 bg-primary-500/10">
                    <div className="flex items-center justify-between mb-3">
                      {!isBye && match.match_time ? (
                        <span className="text-gray-300 text-sm">{new Date(match.match_time).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
                      ) : (
                        <div></div>
                      )}
                      {isBye ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium border bg-amber-500/20 text-amber-300 border-amber-500/30">
                          Miễn thi đấu
                        </span>
                      ) : (
                        (() => getMatchStatusBadge(match))()
                      )}
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
                                          {((scoreA == null && scoreB == null) && match.team_b_participant_id) ? (
                                            // Scheduled but no result: show "A & B"
                                            <span className="text-lg text-gray-200">{(match.team_a_name || match.teamA?.team_name || match.teamA?.name || 'A')} &amp; {(match.team_b_name || match.teamB?.team_name || match.teamB?.name || 'B')}</span>
                                          ) : (
                                            <>
                                              <span className="text-cyan-300 text-3xl">{scoreA != null ? scoreA : '-'}</span>
                                              <span className="text-gray-400">/</span>
                                              <span className="text-yellow-300 text-3xl">{scoreB != null ? scoreB : '-'}</span>
                                            </>
                                          )}
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
                          {(() => {
                            const bye = isByeMatch(match);
                            const name = match.team_a_name || match.teamA?.team_name || match.teamA?.name || match.teamA?.teamName || (bye ? 'BYE' : 'TBD');
                            return (
                              <>
                                <div>{name}</div>
                              </>
                            );
                          })()}
                          <div className="text-sm mt-1 text-green-400">{match.point_team_a != null ? `+${match.point_team_a}` : ''}</div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-center gap-3 mt-2">
                      <div className="flex justify-center gap-3">
                        {(() => {
                          const statusUpper = (match.status || '').toString().toUpperCase();
                          const tournamentDone = ['DONE', 'COMPLETED'].includes((tournament?.status || '').toString().toUpperCase());
                          const totalRounds = tournament?.total_rounds || 0;
                          const isSingleRound = totalRounds === 1;

                          // Show "Cập nhật thời gian" for admins when the match is PENDING,
                          // or when it has no scheduled time and the status isn't COMPLETED/DONE/CANCELLED.
                          const showUpdateTime = isAdmin && !isTeamView && !tournamentDone && !['DONE', 'CANCELLED', 'COMPLETED'].includes(statusUpper) && (statusUpper === 'PENDING' || !match.match_time);

                          // Nếu giải chỉ có 1 vòng, không cho cập nhật kết quả nếu tỷ số hòa
                          const isDrawScore = scoreA != null && scoreB != null && scoreA === scoreB;
                          const blockUpdateDueToDrawInSingleRound = isSingleRound && isDrawScore;

                          // Show "Cập nhật kết quả" only when the match is not DONE/CANCELLED
                          // AND either the scheduled time has been reached or the match is already COMPLETED.
                          const showUpdateResult = isAdmin && !isTeamView && !tournamentDone && !['DONE', 'CANCELLED'].includes(statusUpper) && !!match.team_b_participant_id && (scheduledReached || statusUpper === 'COMPLETED') && !blockUpdateDueToDrawInSingleRound;

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

                              {showUpdateResult ? (
                                <Button variant="primary" size="sm" onClick={() => { console.debug('open score modal', match.id, statusUpper, 'scheduledReached=', scheduledReached); handleOpenScoreModal(match); }} className="text-white">
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                  Cập nhật kết quả
                                </Button>
                              ) : (
                                blockUpdateDueToDrawInSingleRound && isAdmin && !isTeamView && !tournamentDone && !['DONE', 'CANCELLED'].includes(statusUpper) && !!match.team_b_participant_id && (
                                  <div className="text-sm text-yellow-400 px-3 py-1 bg-yellow-400/10 rounded">
                                    Giải 1 vòng không cho phép tỷ số hòa
                                  </div>
                                )
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
        {/* Update Time Modal (moved from TournamentDetail) */}
        {isUpdateTimeModalOpen && selectedMatch && (
          <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-bold text-white">
                  <svg className="w-6 h-6 inline mr-2 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Cập nhật thời gian thi đấu
                </h2>

                <div className="bg-gradient-to-r from-primary-500/10 to-purple-500/10 rounded-lg p-3 border border-primary-500/30 text-center">
                  <span className="text-white font-semibold">
                    {/* reuse parent display helpers via props if needed */}
                    {selectedMatch?.team_a_name || selectedMatch?.teamA?.team_name || selectedMatch?.teamA?.name} VS {selectedMatch?.team_b_name || selectedMatch?.teamB?.team_name || selectedMatch?.teamB?.name}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Chọn ngày & giờ thi đấu</label>
                  <DatePicker
                    selected={scheduledTime}
                    onChange={(d) => setScheduledTime(d)}
                    showTimeSelect
                    timeIntervals={5}
                    timeFormat="HH:mm"
                    dateFormat="dd/MM/yyyy HH:mm"
                    className="w-full px-3 py-2 bg-white border border-primary-700/30 rounded-lg text-gray-900 focus:outline-none focus:border-primary-500"
                    placeholderText="Chọn ngày giờ"
                    disabled={
                      (selectedMatch?.status || '').toString().toUpperCase() === 'DONE' ||
                      (selectedMatch?.status || '').toString().toUpperCase() === 'COMPLETED'
                    }
                    minDate={(() => {
                      const tStart = tournament?.start_date || tournament?.startDate || tournament?.startAt || null;
                      return tStart ? new Date(tStart) : null;
                    })()}
                    maxDate={(() => {
                      const tEnd = tournament?.end_date || tournament?.endDate || tournament?.endAt || null;
                      return tEnd ? new Date(tEnd) : null;
                    })()}
                    minTime={(() => {
                      const tStart = tournament?.start_date || tournament?.startDate || tournament?.startAt || null;
                      if (!tStart || !scheduledTime) return null;
                      const s = new Date(scheduledTime);
                      const start = new Date(tStart);
                      if (s.getFullYear() === start.getFullYear() && s.getMonth() === start.getMonth() && s.getDate() === start.getDate()) {
                        return start;
                      }
                      const d = new Date(); d.setHours(0,0,0,0); return d;
                    })()}
                    maxTime={(() => {
                      const tEnd = tournament?.end_date || tournament?.endDate || tournament?.endAt || null;
                      if (!tEnd || !scheduledTime) return null;
                      const s = new Date(scheduledTime);
                      const end = new Date(tEnd);
                      if (s.getFullYear() === end.getFullYear() && s.getMonth() === end.getMonth() && s.getDate() === end.getDate()) {
                        return end;
                      }
                      const d = new Date(); d.setHours(23,59,59,999); return d;
                    })()}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="secondary" className="flex-1" onClick={handleCloseModals}>Hủy</Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={async () => {
                      const s = (selectedMatch?.status || '').toString().toUpperCase();
                      if (s === 'DONE' || s === 'COMPLETED') {
                        showError('Không thể gán lịch cho trận đấu đã có kết quả hoặc đã bị khoá.');
                        return;
                      }
                      const scheduled = scheduledTime;
                      if (!scheduled) {
                        showError('Vui lòng chọn thời gian');
                        return;
                      }
                      const scheduledMs = new Date(scheduled).getTime();
                      if (Number.isNaN(scheduledMs)) {
                        showError('Thời gian không hợp lệ');
                        return;
                      }
                      const tStart = tournament?.start_date || tournament?.startDate || tournament?.startAt || null;
                      const tEnd = tournament?.end_date || tournament?.endDate || tournament?.endAt || null;
                      if (tStart) {
                        const startMs = new Date(tStart).getTime();
                        if (!Number.isNaN(startMs) && scheduledMs < startMs) {
                          showError('Thời gian trận phải nằm trong khoảng thời gian diễn ra giải đấu');
                          return;
                        }
                      }
                      if (tEnd) {
                        const endMs = new Date(tEnd).getTime();
                        if (!Number.isNaN(endMs) && scheduledMs > endMs) {
                          showError('Thời gian trận phải nằm trong khoảng thời gian diễn ra giải đấu');
                          return;
                        }
                      }
                      const ok = await handleUpdateTime(selectedMatch.id, scheduled);
                      if (ok) handleCloseModals();
                    }}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Cập nhật
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Update Score Modal (moved from TournamentDetail) */}
        {isUpdateScoreModalOpen && selectedMatch && (
          <div className="fixed inset-0 bg-gray-900/70 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-bold text-white">Cập nhật kết quả</h2>

                <div className="bg-gradient-to-r from-primary-500/10 to-purple-500/10 rounded-lg p-3 border border-primary-500/30 text-center">
                  <span className="text-white font-semibold">
                    {selectedMatch && ((selectedMatch.team_a_name || selectedMatch.teamA?.team_name || selectedMatch.teamA?.name) + ' VS ' + (selectedMatch.team_b_name || selectedMatch.teamB?.team_name || selectedMatch.teamB?.name))}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Điểm {selectedMatch?.team_a_name || selectedMatch?.teamA?.name || 'A'}</label>
                    <input
                      type="number"
                      min="0"
                      value={scoreA}
                      onChange={(e) => setScoreA(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-primary-700/30 rounded-lg text-gray-900 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Điểm {selectedMatch?.team_b_name || selectedMatch?.teamB?.name || 'B'}</label>
                    <input
                      type="number"
                      min="0"
                      value={scoreB}
                      onChange={(e) => setScoreB(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-primary-700/30 rounded-lg text-gray-900 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="secondary" className="flex-1" onClick={handleCloseModals}>Hủy</Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    disabled={
                      scoreA === '' || scoreB === '' || selectedMatch?.status === 'DONE' || (
                        !!selectedMatch?.match_time && (() => {
                          const ms = new Date(selectedMatch.match_time).getTime();
                          return !Number.isNaN(ms) && ms > Date.now() && !selectedMatch.__scheduledReached;
                        })()
                      )
                    }
                    onClick={async () => {
                      if (selectedMatch?.status === 'DONE') {
                        showError('Trận đấu đã bị khoá, không thể sửa kết quả.');
                        return;
                      }
                      if (selectedMatch?.match_time) {
                        const ms = new Date(selectedMatch.match_time).getTime();
                        if (!Number.isNaN(ms) && ms > Date.now() && !selectedMatch.__scheduledReached) {
                          showError('Chưa đến thời gian thi đấu, không thể cập nhật kết quả.');
                          return;
                        }
                      }
                      const a = scoreA === '' ? 0 : Number(scoreA);
                      const b = scoreB === '' ? 0 : Number(scoreB);
                      const ok = await handleUpdateScore(selectedMatch.id, a, b);
                      if (ok) handleCloseModals();
                    }}
                  >
                    Xác nhận kết quả
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  };

  export default TournamentMatches;
