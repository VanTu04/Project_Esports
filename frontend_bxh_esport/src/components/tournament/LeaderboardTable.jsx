import Table from '../common/Table';
import { formatRank } from '../../utils/formatters';
import { resolveTeamLogo, normalizeImageUrl } from '../../utils/imageHelpers';
import { TrophyIcon } from '@heroicons/react/24/solid';

const LeaderboardTable = ({ data, loading }) => {
  const columns = [
    {
      header: 'Hạng',
      accessor: 'rank',
      render: (value) => {
        const rank = Number(value) || 0;
        const colorClass = rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-slate-400' : rank === 3 ? 'text-amber-700' : 'text-gray-400';
        return (
          <div className="flex items-center">
            <TrophyIcon className={`w-5 h-5 mr-2 ${colorClass}`} />
            <span className="text-xl">{formatRank(value)}</span>
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
      header: 'Ví',
      accessor: 'wallet',
      render: (value) => (
        <span className="text-xs text-gray-400 font-mono">
          {value ? `${value.slice(0, 6)}...${value.slice(-4)}` : '-'}
        </span>
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
  ];

  return <Table columns={columns} data={data} loading={loading} />;
};

export default LeaderboardTable;