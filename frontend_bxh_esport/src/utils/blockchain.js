import { ethers } from 'ethers';
// import { BLOCKCHAIN_CONFIG } from './constants';

/**
 * Check if MetaMask is installed
 */
export const isMetaMaskInstalled = () => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
};

/**
 * Get provider
 */
export const getProvider = () => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }
  return new ethers.BrowserProvider(window.ethereum);
};

/**
 * Get signer
 */
export const getSigner = async () => {
  const provider = getProvider();
  return await provider.getSigner();
};

/**
 * Connect wallet
 */
export const connectWallet = async () => {
  try {
    if (!isMetaMaskInstalled()) {
      throw new Error('Vui lòng cài đặt MetaMask');
    }
    
    const provider = getProvider();
    const accounts = await provider.send('eth_requestAccounts', []);
    
    if (accounts.length === 0) {
      throw new Error('Không có tài khoản nào được kết nối');
    }
    
    const address = accounts[0];
    const network = await provider.getNetwork();
    
    return {
      address,
      chainId: Number(network.chainId),
      provider,
    };
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
};

/**
 * Disconnect wallet
 */
export const disconnectWallet = () => {
  // MetaMask doesn't have a disconnect method
  // We just clear the local state
  return true;
};

/**
 * Get account balance
 */
export const getBalance = async (address) => {
  try {
    const provider = getProvider();
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Error getting balance:', error);
    throw error;
  }
};

/**
 * Switch network
 */
export const switchNetwork = async (chainId) => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
    return true;
  } catch (error) {
    // This error code indicates that the chain has not been added to MetaMask
    if (error.code === 4902) {
      throw new Error('Network chưa được thêm vào MetaMask');
    }
    throw error;
  }
};

/**
 * Add network to MetaMask
 */
export const addNetwork = async (networkConfig) => {
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: `0x${networkConfig.chainId.toString(16)}`,
          chainName: networkConfig.name,
          nativeCurrency: networkConfig.nativeCurrency,
          rpcUrls: [networkConfig.rpcUrl],
          blockExplorerUrls: [networkConfig.explorerUrl],
        },
      ],
    });
    return true;
  } catch (error) {
    console.error('Error adding network:', error);
    throw error;
  }
};

/**
 * Send transaction
 */
export const sendTransaction = async (to, amount) => {
  try {
    const signer = await getSigner();
    const tx = await signer.sendTransaction({
      to,
      value: ethers.parseEther(amount.toString()),
    });
    
    return tx;
  } catch (error) {
    console.error('Error sending transaction:', error);
    throw error;
  }
};

/**
 * Wait for transaction
 */
export const waitForTransaction = async (txHash) => {
  try {
    const provider = getProvider();
    const receipt = await provider.waitForTransaction(txHash);
    return receipt;
  } catch (error) {
    console.error('Error waiting for transaction:', error);
    throw error;
  }
};

/**
 * Get transaction receipt
 */
export const getTransactionReceipt = async (txHash) => {
  try {
    const provider = getProvider();
    const receipt = await provider.getTransactionReceipt(txHash);
    return receipt;
  } catch (error) {
    console.error('Error getting transaction receipt:', error);
    throw error;
  }
};

/**
 * Sign message
 */
export const signMessage = async (message) => {
  try {
    const signer = await getSigner();
    const signature = await signer.signMessage(message);
    return signature;
  } catch (error) {
    console.error('Error signing message:', error);
    throw error;
  }
};

/**
 * Verify signature
 */
export const verifySignature = (message, signature, address) => {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
};

/**
 * Format wei to ether
 */
export const formatWeiToEther = (wei) => {
  try {
    return ethers.formatEther(wei);
  } catch (error) {
    console.error('Error formatting wei to ether:', error);
    return '0';
  }
};

/**
 * Parse ether to wei
 */
export const parseEtherToWei = (ether) => {
  try {
    return ethers.parseEther(ether.toString());
  } catch (error) {
    console.error('Error parsing ether to wei:', error);
    return BigInt(0);
  }
};

/**
 * Get contract instance
 */
export const getContract = async (address, abi) => {
  try {
    const signer = await getSigner();
    return new ethers.Contract(address, abi, signer);
  } catch (error) {
    console.error('Error getting contract:', error);
    throw error;
  }
};

/**
 * Call contract method (read)
 */
export const callContractMethod = async (contract, method, ...args) => {
  try {
    return await contract[method](...args);
  } catch (error) {
    console.error(`Error calling contract method ${method}:`, error);
    throw error;
  }
};

/**
 * Send contract transaction (write)
 */
export const sendContractTransaction = async (contract, method, ...args) => {
  try {
    const tx = await contract[method](...args);
    await tx.wait();
    return tx;
  } catch (error) {
    console.error(`Error sending contract transaction ${method}:`, error);
    throw error;
  }
};

/**
 * Estimate gas
 */
export const estimateGas = async (transaction) => {
  try {
    const provider = getProvider();
    const gasEstimate = await provider.estimateGas(transaction);
    return gasEstimate;
  } catch (error) {
    console.error('Error estimating gas:', error);
    throw error;
  }
};

/**
 * Get gas price
 */
export const getGasPrice = async () => {
  try {
    const provider = getProvider();
    const feeData = await provider.getFeeData();
    return feeData.gasPrice;
  } catch (error) {
    console.error('Error getting gas price:', error);
    throw error;
  }
};

/**
 * Listen to account changes
 */
export const onAccountsChanged = (callback) => {
  if (!isMetaMaskInstalled()) return;
  
  window.ethereum.on('accountsChanged', (accounts) => {
    callback(accounts[0] || null);
  });
};

/**
 * Listen to chain changes
 */
export const onChainChanged = (callback) => {
  if (!isMetaMaskInstalled()) return;
  
  window.ethereum.on('chainChanged', (chainId) => {
    callback(parseInt(chainId, 16));
  });
};

/**
 * Remove listeners
 */
export const removeListeners = () => {
  if (!isMetaMaskInstalled()) return;
  
  window.ethereum.removeAllListeners('accountsChanged');
  window.ethereum.removeAllListeners('chainChanged');
};