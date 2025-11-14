import { formatDate, formatWalletAddress } from '../../utils/helpers';
import { formatTxHash, formatExplorerUrl } from '../../utils/formatters';
import { formatCurrency } from '../../utils/helpers';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import Table from '../common/Table';

export const TransactionHistory = ({ transactions, loading }) => {
  // Detect transaction shape and render appropriate columns
  const columns = [];
  if (transactions && transactions.length > 0 && transactions[0].hash) {
    // Provider-style transactions (from WalletService)
    columns.push(
      {
        header: 'Hash',
        accessor: 'hash',
        render: (value) => (
          <a href={formatExplorerUrl(value, 'tx')} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary-500 hover:text-primary-400">
            <span>{formatTxHash(value)}</span>
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </a>
        ),
      },
      {
        header: 'From',
        accessor: 'from',
        render: (value) => <span className="text-sm text-gray-300">{formatWalletAddress(value)}</span>,
      },
      {
        header: 'To',
        accessor: 'to',
        render: (value) => <span className="text-sm text-gray-300">{formatWalletAddress(value)}</span>,
      },
      {
        header: 'Số tiền',
        accessor: 'value',
        render: (value) => <span className="font-semibold text-primary-500">{formatCurrency(Number(value), 'ETH')}</span>,
      },
      {
        header: 'Block',
        accessor: 'blockNumber',
      },
    );
  } else {
    // Generic transaction shape (existing app-level transactions)
    columns.push(
      {
        header: 'Transaction Hash',
        accessor: 'txHash',
        render: (value) => (
          <a
            href={formatExplorerUrl(value, 'tx')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary-500 hover:text-primary-400"
          >
            <span>{formatTxHash(value)}</span>
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </a>
        ),
      },
      {
        header: 'Loại',
        accessor: 'type',
        render: (value) => (
          <span className="px-2 py-1 bg-dark-300 rounded text-xs">
            {value}
          </span>
        ),
      },
      {
        header: 'Số tiền',
        accessor: 'amount',
        render: (value, row) => (
          <span className="font-semibold text-primary-500">
            {formatCurrency(Number(value), row.currency || 'ETH')}
          </span>
        ),
      },
      {
        header: 'Trạng thái',
        accessor: 'status',
        render: (value) => {
          const colors = {
            success: 'text-green-500',
            pending: 'text-yellow-500',
            failed: 'text-red-500',
          };
          return (
            <span className={`font-medium ${colors[value] || 'text-gray-400'}`}>
              {value}
            </span>
          );
        },
      },
      {
        header: 'Thời gian',
        accessor: 'createdAt',
        render: (value) => (
          <span className="text-sm text-gray-400">
            {formatDate(value)}
          </span>
        ),
      }
    );
  }

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