import Table from '../common/Table';
import { formatRank } from '../../utils/formatters';
import { resolveTeamLogo, normalizeImageUrl } from '../../utils/imageHelpers';
import { TrophyIcon } from '@heroicons/react/24/solid';

const LeaderboardTable = ({ data, loading, rewards, showRewardColumn = true }) => {
  // Accept raw leaderboard payload and normalize here so caller is simpler
  const rows = (Array.isArray(data) ? data : []).map((row, idx) => {
    // some leaderboard payloads don't include `rank` — fall back to index+1
    const rank = row?.rank ?? row?.position ?? (Number(idx) + 1);
    // reward priority: explicit row.reward > rewards prop mapping by rank
    const rewardValue = row?.reward ?? (rewards && (rewards[Number(rank)] ?? rewards[String(Number(rank))])) ?? null;
    return {
      rank,
      wallet: row?.wallet ?? '',
      score: row?.score ?? 0,
      reward: rewardValue,
      userId: row?.userId ?? null,
      username: row?.username ?? '',
      avatar: row?.avatar ?? null,
      teamName: row?.teamName ?? row?.username ?? '',
      wins: row?.wins ?? 0,
      losses: row?.losses ?? 0,
      draws: row?.draws ?? 0,
      totalMatches: row?.totalMatches ?? 0,
      buchholzScore: row?.buchholzScore ?? 0,
      sonnebornBerger: row?.sonnebornBerger ?? 0,
      team: { logo: row?.avatar ?? null, name: row?.teamName ?? row?.username ?? '' }
    };
  });

  // Dev helper: log when rewards prop is present but rows appear empty — helps debug detail vs modal differences
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
    try {
      console.debug('LeaderboardTable debug:', { sampleRow: rows[0] ?? null, rewardsProp: rewards });
    } catch (e) {}
  }

  const columns = [
    {
      header: 'Hạng',
      accessor: 'rank',
      headerClassName: 'sticky left-0 bg-dark-500 z-20',
      cellClassName: 'sticky left-0 bg-dark-400 z-10',
      render: (value, row) => {
        const rank = Number(value) || 0;
        const colorClass = rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-slate-400' : rank === 3 ? 'text-amber-700' : 'text-gray-400';
        return (
          <div className="flex items-center">
            <TrophyIcon className={`w-5 h-5 mr-2 ${colorClass}`} />
            <span className="text-lg font-semibold">{formatRank(value)}</span>
          </div>
        );
      },
    },

    {
      header: 'Logo',
      accessor: 'avatar',
      render: (avatar, row) => {
        const src = avatar || row?.team?.avatar || null;
        return (
          <div className="flex items-center">
            {src ? (
              <img
                src={src}
                alt={row?.teamName || row?.username || 'team'}
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-700/30" />
            )}
          </div>
        );
      },
    },
    {
      header: 'Tên đội',
      accessor: 'teamName',
      render: (value, row) => (
        <div>
          <div className="font-medium text-white">{value || row?.username || '-'}</div>
          {row?.username && <div className="text-xs text-gray-400">@{row.username}</div>}
        </div>
      ),
    },
    {
      header: 'Điểm',
      accessor: 'score',
      render: (value) => <span className="font-bold text-primary-500 text-lg">{value ?? 0}</span>,
    },
    
    {
      header: 'Thắng/Thua/Hòa',
      accessor: 'wins',
      render: (wins, row) => (
        <div className="text-sm">
          <span className="text-green-400">{wins ?? 0}</span>
          <span className="text-gray-400"> / </span>
          <span className="text-red-400">{row?.losses ?? 0}</span>
          <span className="text-gray-400"> / </span>
          <span className="text-yellow-400">{row?.draws ?? 0}</span>
        </div>
      ),
    },
    {
      header: 'Tổng trận',
      accessor: 'totalMatches',
      render: (value) => <span className="text-gray-300">{value ?? 0}</span>,
    },
    {
      header: 'Tổng điểm đối thủ',
      accessor: 'buchholzScore',
      render: (value) => (
        <span className="text-cyan-400 font-semibold" title="Tổng điểm của các đối thủ đã gặp">
          {value ?? 0}
        </span>
      ),
    },
    {
      header: 'Sonneborn-Berger',
      accessor: 'sonnebornBerger',
      render: (value) => (
        <span className="text-cyan-400 font-semibold" title="Buchholz có trọng số kết quả">
          {value ?? 0}
        </span>
      ),
    },
    ...(showRewardColumn ? [
      {
        header: 'Phần thưởng (ETH)',
        accessor: 'reward',
        render: (value, row) => {
          const rank = Number(row?.rank) || 0;
          const colorClass = rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-slate-400' : rank === 3 ? 'text-amber-700' : 'text-gray-200';
          return (
            value != null && value !== '' ? (
              <span className={`text-sm font-medium ${colorClass}`}>{Number(value).toFixed(4)}</span>
            ) : (
              <span className="text-gray-400">-</span>
            )
          );
        }
      }
    ] : []),
    {
      header: 'Ví',
      accessor: 'wallet',
      render: (value) => {
        return value ? `${value.slice(0, 6)}...${value.slice(-4)}` : '-';
      },
    },
  ];

  return <Table columns={columns} data={rows} loading={loading} noHorizontalScroll={false} />;
};

export default LeaderboardTable;