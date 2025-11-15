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
      const resp = await blockchainService.getAllTransactions();
      const payload = resp?.data ?? resp;
      const txs = payload?.data ?? payload?.transactions ?? payload ?? [];
      setTransactions(Array.isArray(txs) ? txs : txs?.data ?? []);
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
      const balResp = await blockchainService.getMyWalletBalance();
      const balObj = balResp?.data ?? balResp;
      const finalBal = balObj?.data ?? balObj?.balance ?? balObj?.balanceEth ?? balObj ?? null;
      setBalance(finalBal ?? null);

      const txs = await blockchainService.getMyWalletTransactions();
      const txPayload = txs?.data ?? txs ?? [];
      setWalletTransactions(Array.isArray(txPayload) ? txPayload : txPayload?.data ?? []);
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
      {/* Global blockchain transactions */}

      {/* User wallet transactions (from /wallet/transactions) */}
      <div className="mt-8">
        <TransactionHistory transactions={walletTransactions} loading={walletLoading} />
      </div>
    </div>
  );
};