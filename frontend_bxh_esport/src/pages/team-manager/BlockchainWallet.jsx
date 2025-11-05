import { WalletConnect } from '../../components/blockchain/WalletConnect';
import { TransactionHistory } from '../../components/blockchain/TransactionHistory';
import { useEffect, useState } from 'react';

export const BlockchainWallet = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Ví Blockchain</h1>
      <WalletConnect />
      <TransactionHistory transactions={transactions} loading={loading} />
    </div>
  );
};