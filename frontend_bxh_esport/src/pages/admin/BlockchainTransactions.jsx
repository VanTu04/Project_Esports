import { useEffect, useState } from 'react';
import blockchainService from '../../services/blockchainService';
import { TransactionHistory } from '../../components/blockchain/TransactionHistory';
import Button from '../../components/common/Button';
import { useNotification } from '../../context/NotificationContext';
import { formatCurrency } from '../../utils/helpers';

export const BlockchainTransactions = () => {
  const [balance, setBalance] = useState(null);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const { showError } = useNotification();

  useEffect(() => {
    loadWalletData(1, 5);
  }, []);

  const loadWalletData = async (page = 1, size = 10) => {
    setWalletLoading(true);
    setCurrentPage(page);
    setPageSize(size);

    try {
      // ---- GET BALANCE ----
      const balResp = await blockchainService.getMyWalletBalance();
      const balanceEth = balResp?.data?.data?.balanceEth ?? null;
      setBalance(balanceEth);

      // ---- GET TRANSACTION HISTORY ----
      const txResp = await blockchainService.getMyWalletTransactions({ page, size });
      console.log('Transaction response:', txResp);
      const transactions = txResp?.data?.data ?? [];
      const total = txResp?.data?.totalItems ?? txResp?.data?.total ?? txResp?.data?.pagination?.total ?? transactions?.length ?? 0;
      setWalletTransactions(transactions);
      setTotalTransactions(total);
      console.log('Total transactions:', total, 'Current page:', page, 'Page size:', size, 'Total pages:', txResp?.data?.totalPages);
      // Try to capture current user id from returned transactions (fallback)
      const possibleId = transactions?.[0]?.user_id ?? transactions?.[0]?.user?.id ?? null;
      setCurrentUserId(possibleId);

    } catch (err) {
      console.error(err);
      showError(err?.response?.data?.message || err?.message || 'Không thể tải dữ liệu ví');
      setBalance(null);
      setWalletTransactions([]);
      setTotalTransactions(0);
    } finally {
      setWalletLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Ví Blockchain</h1>

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
            {balance != null ? `${balance} ETH` : '-'}
          </span>
        </div>
      </div>

      <TransactionHistory 
        transactions={walletTransactions} 
        loading={walletLoading} 
        view="admin" 
        currentUserId={currentUserId}
        total={totalTransactions}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={(page, size) => loadWalletData(page, size)}
      />
    </div>
  );
};