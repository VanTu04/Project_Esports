import { formatDate, formatWalletAddress } from '../../utils/helpers';
import { formatTxHash, formatExplorerUrl } from '../../utils/formatters';
import { formatCurrency } from '../../utils/helpers';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import Table from '../common/Table';

export const TransactionHistory = ({ transactions, loading, view = 'team', currentUserId = null }) => {
  const renderTeamName = (row) => {
    // Show the team that SENT the money (fromUser) as requested
    return (
      row.fromUser?.username || row.fromUser?.full_name || row.user?.username || row.user?.full_name || row.toUser?.full_name || '-'
    );
  };

  const translateType = (type) => {
    if (!type) return '-';
    const t = String(type).toUpperCase();
    switch (t) {
      case 'REGISTER': return 'Đăng ký';
      case 'FUND_CONTRACT': return 'Nạp tiền vào contract';
      case 'PAYOUT': return 'Thanh toán';
      case 'RECEIVE_REFUND': return 'Hoàn tiền';
      case 'APPROVE': return 'Phê duyệt';
      case 'REJECT': return 'Từ chối';
      case 'RECEIVE_REWARD': return 'Nhận giải thưởng';
      
      default: return type;
    }
  };

  const renderAmount = (row) => {
    const amt = Number(row.blockchain?.valueEth ?? row.amount ?? 0);

    const senderId = row.fromUser?.id ?? row.from_user_id;
    const receiverId = row.toUser?.id ?? row.to_user_id;

    // Use `currentUserId` when provided (from the page that requested transactions).
    // Determine whether the current user (admin or team) is the sender/receiver.
    const isCurrentUserSender = currentUserId && senderId && Number(currentUserId) === Number(senderId);
    const isCurrentUserReceiver = currentUserId && receiverId && Number(currentUserId) === Number(receiverId);

    let sign = '+';
    if (view === 'admin') {
      // Admin view: show + when admin/current user is the receiver, otherwise -
      sign = isCurrentUserReceiver ? '+' : '-';
    } else {
      // Team view: show - when team/current user is the sender, otherwise +
      sign = isCurrentUserSender ? '-' : '+';
    }

    const colorClass = sign === '+' ? 'text-emerald-400' : 'text-rose-400';

    return <span className={colorClass}>{sign}{formatCurrency(amt, 'ETH')}</span>;
  };

  const columns = [
    {
      header: 'Giải đấu',
      accessor: 'tournament.name',
      render: (_, row) => <span>{row.tournament?.name || '-'}</span>,
    },
    {
      header: 'Từ',
      accessor: 'blockchain.from',
      render: (_, row) => (
        <span>{row.fromUser?.username || row.fromUser?.full_name || formatWalletAddress(row.blockchain?.from) || '-'}</span>
      ),
    },
    {
      header: 'Đến',
      accessor: 'blockchain.to',
      render: (_, row) => (
        <span>{row.toUser?.username || row.toUser?.full_name || formatWalletAddress(row.blockchain?.to) || '-'}</span>
      ),
    },
    {
      header: 'Loại',
      accessor: 'type',
      render: (value, row) => <span>{translateType(value ?? row.type)}</span>,
    },
    {
      header: 'Số tiền (ETH)',
      accessor: 'blockchain.valueEth',
      render: (_, row) => renderAmount(row),
    },
    {
      header: 'Thời gian',
      accessor: 'created_at',
      render: (_, row) => <span>{formatDate(row.created_at)}</span>,
    },
    {
      header: 'Ghi chú',
      accessor: 'description',
      cellClassName: '!whitespace-normal',
      render: (_, row) => {
        const t = String(row.type ?? '').toUpperCase();
        let note = '';

        // FUND_CONTRACT or RECEIVE_REWARD -> show description
        if (t === 'FUND_CONTRACT' || t === 'RECEIVE_REWARD'||t === 'RECEIVE_REFUND') {
          note = row.description ;
        } 
          note = row.description;
      

        return (
          <span
            className="text-sm text-gray-300"
            title={typeof note === 'string' ? note : ''}
            style={{
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                wordBreak: 'break-word',
                whiteSpace: 'normal',
                width: '70%'
              }}
          >
            {note}
          </span>
        );
      }
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
