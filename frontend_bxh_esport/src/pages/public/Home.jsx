import React, { useState, useEffect } from "react";
import PublicLayout from "../../components/layout/PublicLayout";
import Card from "../../components/common/Card";
import { TrophyIcon, UsersIcon } from '@heroicons/react/24/outline';
import { TournamentList } from '../../components/tournament/TournamentList';
import { TournamentCard } from '../../components/tournament/TournamentCard';
import tournamentService from '../../services/tournamentService';
import { formatCurrency } from '../../utils/helpers';

const Home = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [featured, setFeatured] = useState([]);
  const [matchesToday, setMatchesToday] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoadingTournaments(true);
      try {
        const resp = await tournamentService.getAllTournaments({ status: 'ongoing' });
        const payload = resp?.data ?? resp;
        let arr = [];
        if (Array.isArray(payload)) arr = payload;
        else if (Array.isArray(payload.tournaments)) arr = payload.tournaments;
        else if (Array.isArray(payload.data)) arr = payload.data;

        if (!mounted) return;
        setTournaments(arr);

        // Build featured list: prefer tournaments that are open for registration
        try {
          // `arr` contains the ongoing tournaments fetched above (status=ongoing)
          const ongoingArr = arr;

          // Fetch pending tournaments that are ready (isReady = 1)
          const respPending = await tournamentService.getAllTournaments({ status: 'pending', isReady: 1 });
          const pPayload = respPending?.data ?? respPending;
          const pendingArr = Array.isArray(pPayload) ? pPayload : (pPayload?.data || pPayload?.tournaments || []);

          if (Array.isArray(pendingArr) && pendingArr.length >= 6) {
            setFeatured(pendingArr.slice(0, 6));
          } else {
            // Fill remaining slots with ongoing and completed tournaments
            const respCompleted = await tournamentService.getAllTournaments({ status: 'completed' });
            const cPayload = respCompleted?.data ?? respCompleted;
            const completedArr = Array.isArray(cPayload) ? cPayload : (cPayload?.data || cPayload?.tournaments || []);

            const pool = [...pendingArr, ...ongoingArr, ...completedArr];
            // shuffle
            for (let i = pool.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [pool[i], pool[j]] = [pool[j], pool[i]];
            }
            setFeatured(pool.slice(0, 6));
          }

          // Find matches scheduled for today from ongoing tournaments (use current_round)
          const todayMatches = [];
          const today = new Date();
          const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

          for (const t of ongoingArr) {
            const round = t.current_round || 1;
            try {
              const mResp = await tournamentService.getTournamentMatches(t.id, { round_number: round });
              const mPayload = mResp?.data?.matches ?? mResp?.matches ?? mResp?.data ?? mResp;
              const matchesArr = Array.isArray(mPayload) ? mPayload : (mPayload?.matches || mPayload?.data || []);
              for (const m of matchesArr) {
                const mt = m.match_time ? new Date(m.match_time) : (m.matchTime ? new Date(m.matchTime) : null);
                if (mt && isSameDay(mt, today)) {
                  todayMatches.push({
                    ...m,
                    tournamentName: t.tournament_name || t.name
                  });
                }
              }
            } catch (err) {
              // continue silently per-tournament
            }
          }

          setMatchesToday(todayMatches);
        } catch (e) {
          // fallback: use first 6 tournaments from arr
          setFeatured(arr.slice(0, 6));
        }
      } catch (err) {
        console.error('Load tournaments error:', err);
        setTournaments([]);
      } finally {
        if (mounted) setLoadingTournaments(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  
    


  return (
    <PublicLayout>
      <div className="min-h-screen bg-[#0e0e0e] text-white flex flex-col">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-700/50 via-gray-900 to-primary-600/30"></div>
          <div className="relative max-w-7xl mx-auto px-4 py-16">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-500/20 rounded-full text-primary-300 text-sm mb-4">
                <span className="font-medium">Nền tảng Esport #1 Việt Nam</span>
              </div>
            <h1 className="text-4xl font-bold mb-4">Chinh phục <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">đỉnh cao</span> Esport</h1>
              <p className="text-gray-400 mb-6">Tham gia các giải đấu chuyên nghiệp, kết nối với cộng đồng game thủ.</p>
              <div className="flex gap-3">
                <a href="/tournaments" className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 rounded-lg font-medium hover:opacity-90 flex items-center gap-2">Xem giải đấu</a>
                <a href="/tournaments" className="px-6 py-2.5 border border-primary-500/50 rounded-lg hover:bg-primary-500/20">Đăng ký</a>
              </div>
            </div>
          </div>
        </section>

        {/* Matches Today */}
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Trận đấu hôm nay</h2>
            <a href="/schedule" className="font-semibold text-yellow-400 hover:text-yellow-300 text-sm">Xem lịch</a>
          </div>
          {matchesToday.length === 0 ? (
            <div className="text-gray-400">Không có trận đấu nào hôm nay.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matchesToday.map((m) => (
                <Card key={m.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-400">{m.tournamentName}</div>
                      <div className="text-lg font-semibold">{m.teamA?.team_name || m.team_a_name || 'TBD'} vs {m.teamB?.team_name || m.team_b_name || 'TBD'}</div>
                      <div className="text-sm text-gray-400">{m.match_time ? new Date(m.match_time).toLocaleString('vi-VN') : (m.matchTime ? new Date(m.matchTime).toLocaleString('vi-VN') : 'Thời gian chưa được đặt')}</div>
                    </div>
                    <div className="text-sm text-gray-300">{m.status}</div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Featured tournaments (6 small cards: 2 register, 2 ongoing, 2 finished) */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">Giải đấu nổi bật</h2>
            <a href="/tournaments" className="font-semibold text-yellow-400 hover:text-yellow-300 text-sm">Xem tất cả</a>
          </div>

          {loadingTournaments ? (
            <div className="text-gray-400">Đang tải...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {/** We'll pick 2 pending/register, 2 ongoing, 2 completed **/}
              {(() => {
                const pending = featured.filter(f => ((f.status || '').toString().toUpperCase() === 'PENDING' || (f.status || '').toString().toUpperCase() === 'REGISTRATION' || f.registration)) || [];
                const ongoing = featured.filter(f => ((f.status || '').toString().toUpperCase() === 'ACTIVE' || (f.status || '').toString().toUpperCase() === 'ONGOING')) || [];
                const completed = featured.filter(f => ((f.status || '').toString().toUpperCase() === 'COMPLETED' || (f.status || '').toString().toUpperCase() === 'DONE' || (f.status || '').toString().toUpperCase() === 'FINISHED')) || [];

                const pick = (arr, n) => {
                  if (!arr || arr.length === 0) return [];
                  if (arr.length <= n) return arr.slice(0, n);
                  // prefer those with registration flag for pending
                  return arr.slice(0, n);
                };

                const picks = [];
                picks.push(...pick(pending, 2));
                picks.push(...pick(ongoing, 2));
                picks.push(...pick(completed, 2));

                // If we don't have 6, fill from featured pool (prioritize ongoing then pending then completed)
                // If `featured` doesn't contain enough items, also consider the main
                // `tournaments` list (ongoing) to fill remaining slots so we show up to 6.
                const all = [...featured, ...(tournaments || [])];
                for (let i = picks.length; i < 6 && all.length > 0; i++) {
                  const candidate = all.shift();
                  if (!picks.find(p => p.id === candidate.id)) picks.push(candidate);
                }

                return picks.slice(0, 6).map(t => (
                  <div key={t.id} className="bg-gray-800/50 rounded-xl overflow-hidden border border-primary-500/10 hover:border-primary-500/30 transition">
                    <TournamentCard compact tournament={{
                      id: t.id,
                      name: t.tournament_name || t.name,
                      description: t.description || t.desc || '',
                      startDate: t.start_date || t.startDate,
                      endDate: t.end_date || t.endDate,
                      banner: t.banner || t.image || null,
                      prize: t.prize || t.total_prize || null,
                      participantsCount: t.participantsCount || t.participants?.length || 0,
                      status: t.status || t.state
                    }} />
                  </div>
                ));
              })()}
            </div>
          )}
        </section>
      </div>
    </PublicLayout>
  );
};

export default Home;
