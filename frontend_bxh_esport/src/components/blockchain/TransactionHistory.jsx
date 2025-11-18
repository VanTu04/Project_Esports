import { formatDate, formatWalletAddress } from '../../utils/helpers';
import { formatTxHash, formatExplorerUrl } from '../../utils/formatters';
import { formatCurrency } from '../../utils/helpers';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import Table from '../common/Table';

export const TransactionHistory = ({ transactions, loading }) => {
  const columns = [
    {
      header: 'Giải đấu',
      accessor: 'tournament.name',
      render: (_, row) => <span>{row.tournament?.name || '-'}</span>,
    },
    {
      header: 'Tên team',
      accessor: 'user.full_name',
      render: (_, row) => <span>{row.user?.full_name || '-'}</span>,
    },
    {
      header: 'Actor',
      accessor: 'actor',
      render: (value) => <span>{value}</span>,
    },
    {
      header: 'Loại',
      accessor: 'type',
      render: (value) => <span>{value}</span>,
    },
    {
      header: 'From',
      accessor: 'blockchain.from',
      render: (_, row) => (
        <span>{formatWalletAddress(row.blockchain?.from)}</span>
      ),
    },
    {
      header: 'To',
      accessor: 'blockchain.to',
      render: (_, row) => (
        <span>{formatWalletAddress(row.blockchain?.to)}</span>
      ),
    },
    {
      header: 'Số tiền (ETH)',
      accessor: 'blockchain.valueEth',
      render: (_, row) =>
        formatCurrency(Number(row.blockchain?.valueEth ?? 0), 'ETH'),
    },
    {
      header: 'Thời gian',
      accessor: 'created_at',
      render: (_, row) => <span>{formatDate(row.created_at)}</span>,
    },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">
        Lịch sử giao dịch
      </h3>

      <Table
        columns={columns}
        data={transactions}
        loading={loading}
        emptyMessage="Chưa có giao dịch nào"
      />
    </div>
  );
};
