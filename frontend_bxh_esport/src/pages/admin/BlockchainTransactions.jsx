import { useEffect, useState } from 'react';
import blockchainService from '../../services/blockchainService';
import { TransactionHistory } from '../../components/blockchain/TransactionHistory';

export const BlockchainTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Giao dịch Blockchain</h1>
      <TransactionHistory transactions={transactions} loading={loading} />
    </div>
  );
};