import { useEffect, useState } from 'react';
import blockchainService from '../../services/blockchainService';
import { TransactionHistory } from '../../components/blockchain/TransactionHistory';
import Button from '../../components/common/Button';
import { useNotification } from '../../context/NotificationContext';
import { formatCurrency } from '../../utils/helpers';

export const BlockchainTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  // walletAddress not needed — use authenticated user's wallet from backend
  const [balance, setBalance] = useState(null);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [walletLoading, setWalletLoading] = useState(true);
  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    loadTransactions();
    loadWalletData();
  }, []);

  const loadTransactions = async () => {
    try {
      const data = await blockchainService.getAllTransactions();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadWalletData = async () => {
    setWalletLoading(true);
    try {
      // Call authenticated endpoints that use req.user on the backend
      const bal = await blockchainService.getMyWalletBalance();
      // bal expected shape: { address, balanceEth }
      setBalance(bal?.balanceEth ?? bal?.balance ?? null);

      const txs = await blockchainService.getMyWalletTransactions();
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
      <h1 className="text-3xl font-bold text-white">Giao dịch Blockchain</h1>
      <div className="p-4 bg-dark-300 rounded-md border border-primary-700/20">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Ví hiện tại</h2>
          <Button variant="ghost" onClick={loadWalletData} disabled={walletLoading}>{walletLoading ? 'Đang tải...' : 'Làm mới'}</Button>
        </div>
        <div className="mt-4">
          <span className="text-sm text-gray-300 mr-2">Số dư:</span>
          <span className="font-semibold text-white">{balance != null ? formatCurrency(Number(balance), 'ETH') : '-'}</span>
        </div>
      </div>
      <TransactionHistory transactions={transactions} loading={loading} />
    </div>
  );
};