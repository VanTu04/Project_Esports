import Table from '../common/Table';
import { formatRank } from '../../utils/formatters';

const LeaderboardTable = ({ data, loading }) => {
  const columns = [
    {
      header: 'Hạng',
      accessor: 'rank',
      render: (value) => (
        <span className="text-xl">{formatRank(value)}</span>
      ),
    },
    {
      header: 'Đội',
      accessor: 'team',
      render: (value) => (
        <div className="flex items-center gap-3">
          <img
            src={value.logo || '/default-team.png'}
            alt={value.name}
            className="w-8 h-8 rounded-full object-cover"
          />
          <span className="font-medium text-white">{value.name}</span>
        </div>
      ),
    },
    {
      header: 'Trận thắng',
      accessor: 'wins',
      render: (value) => <span className="text-green-500 font-bold">{value}</span>,
    },
    {
      header: 'Trận thua',
      accessor: 'losses',
      render: (value) => <span className="text-red-500">{value}</span>,
    },
    {
      header: 'Điểm',
      accessor: 'points',
      render: (value) => <span className="font-bold text-primary-500">{value}</span>,
    },
  ];

  return <Table columns={columns} data={data} loading={loading} />;
};

export default LeaderboardTable;