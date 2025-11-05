import { WalletIcon } from '@heroicons/react/24/outline';
import { useWeb3 } from '../../context/Web3Context';
import { formatWalletAddress } from '../../utils/helpers';
import Button from '../common/Button';
import Card from '../common/Card';

export const WalletConnect = () => {
  const { account, balance, isConnected, isConnecting, connect, disconnect } = useWeb3();

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary-500/10 rounded-lg">
            <WalletIcon className="h-6 w-6 text-primary-500" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Blockchain Wallet</h3>
            {isConnected ? (
              <>
                <p className="text-sm text-gray-400">
                  {formatWalletAddress(account)}
                </p>
                <p className="text-xs text-primary-500">{balance} ETH</p>
              </>
            ) : (
              <p className="text-sm text-gray-400">Chưa kết nối</p>
            )}
          </div>
        </div>

        <Button
          variant={isConnected ? 'secondary' : 'primary'}
          onClick={isConnected ? disconnect : connect}
          loading={isConnecting}
        >
          {isConnected ? 'Ngắt kết nối' : 'Kết nối ví'}
        </Button>
      </div>
    </Card>
  );
};