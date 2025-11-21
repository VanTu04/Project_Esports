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
      accessor: 'team',
      render: (team) => {
        // team may be an object with nested shapes; try resolveTeamLogo first then fallbacks
        let src = resolveTeamLogo(team);
        // if resolveTeamLogo returned null, try common raw fields
        if (!src) {
          if (typeof team?.logo === 'string' && team.logo) src = normalizeImageUrl(team.logo);
          else if (typeof team?.logo_url === 'string' && team.logo_url) src = normalizeImageUrl(team.logo_url);
          else if (typeof team?.avatar === 'string' && team.avatar) src = normalizeImageUrl(team.avatar);
          else if (typeof team?.team?.avatar === 'string' && team.team.avatar) src = normalizeImageUrl(team.team.avatar);
        }

        return (
          <div className="flex items-center">
            {src ? (
              <img
                src={src}
                alt={team?.name || 'team'}
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
      accessor: 'team',
      render: (team) => (
        <span className="font-medium text-white">{team?.name || '-'}</span>
      ),
    },
    {
      header: 'Điểm',
      accessor: 'points',
      render: (value) => <span className="font-bold text-primary-500">{value ?? 0}</span>,
    },
  ];

  return <Table columns={columns} data={data} loading={loading} />;
};

export default LeaderboardTable;