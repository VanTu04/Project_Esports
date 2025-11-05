import { createContext, useContext, useState, useEffect } from 'react';
import {
  connectWallet,
  disconnectWallet,
  getBalance,
  isMetaMaskInstalled,
  onAccountsChanged,
  onChainChanged,
  removeListeners,
} from '../utils/blockchain';
import { STORAGE_KEYS } from '../utils/constants';

const Web3Context = createContext(null);

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState('0');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    checkConnection();
    setupListeners();

    return () => {
      removeListeners();
    };
  }, []);

  useEffect(() => {
    if (account) {
      loadBalance();
    }
  }, [account]);

  const checkConnection = async () => {
    try {
      const savedAddress = localStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS);
      if (savedAddress && isMetaMaskInstalled()) {
        const { address, chainId: connectedChainId } = await connectWallet();
        setAccount(address);
        setChainId(connectedChainId);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Failed to check connection:', error);
    }
  };

  const setupListeners = () => {
    onAccountsChanged((newAccount) => {
      if (newAccount) {
        setAccount(newAccount);
        localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, newAccount);
      } else {
        disconnect();
      }
    });

    onChainChanged((newChainId) => {
      setChainId(newChainId);
      window.location.reload();
    });
  };

  const loadBalance = async () => {
    try {
      const bal = await getBalance(account);
      setBalance(bal);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const connect = async () => {
    if (!isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    setIsConnecting(true);
    try {
      const { address, chainId: connectedChainId } = await connectWallet();
      setAccount(address);
      setChainId(connectedChainId);
      setIsConnected(true);
      localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, address);
      return address;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    disconnectWallet();
    setAccount(null);
    setChainId(null);
    setBalance('0');
    setIsConnected(false);
    localStorage.removeItem(STORAGE_KEYS.WALLET_ADDRESS);
  };

  const value = {
    account,
    chainId,
    balance,
    isConnecting,
    isConnected,
    isMetaMaskInstalled: isMetaMaskInstalled(),
    connect,
    disconnect,
    loadBalance,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within Web3Provider');
  }
  return context;
};