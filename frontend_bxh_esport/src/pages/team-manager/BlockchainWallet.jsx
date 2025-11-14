import { useEffect, useState } from 'react';
import { TransactionHistory } from '../../components/blockchain/TransactionHistory';
import blockchainService from '../../services/blockchainService';
import Button from '../../components/common/Button';
import { useNotification } from '../../context/NotificationContext';
import { formatCurrency } from '../../utils/helpers';

export const BlockchainWallet = () => {
  const [balance, setBalance] = useState(null);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [walletLoading, setWalletLoading] = useState(true);
  const { showError } = useNotification();

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    setWalletLoading(true);
    try {
      // Lấy số dư ví team từ backend
      const bal = await blockchainService.getTeamWalletBalance();
      setBalance(bal?.balanceEth ?? bal?.balance ?? null);

      // Lấy lịch sử giao dịch của team
      const txs = await blockchainService.getTeamWalletTransactions();
      setWalletTransactions(Array.isArray(txs) ? txs : []);
    } catch (err) {
      console.error(err);
      showError(err?.response?.data?.message || err?.message || 'Không thể tải dữ liệu ví');
      setBalance(null);
      setWalletTransactions([]);
    } finally {
      setWalletLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Ví Blockchain của Team</h1>

      <div className="p-4 bg-dark-300 rounded-md border border-primary-700/20">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Thông tin ví</h2>
          <Button variant="ghost" onClick={loadWalletData} disabled={walletLoading}>
            {walletLoading ? 'Đang tải...' : 'Làm mới'}
          </Button>
        </div>
        <div className="mt-4">
          <span className="text-sm text-gray-300 mr-2">Số dư:</span>
          <span className="font-semibold text-white">
            {balance != null ? formatCurrency(Number(balance), 'ETH') : '-'}
          </span>
        </div>
      </div>

      <TransactionHistory transactions={walletTransactions} loading={walletLoading} />
    </div>
  );
};
