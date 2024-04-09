import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import { JsonRpcProvider } from 'ethers/providers';
import { contractsConfig } from './contractsConfig';

const AppContext = createContext();
const infuraProvider = new JsonRpcProvider(contractsConfig.infuraRPCURL); 

const ContextProvider = ({ children }) => {
  const [ethAmount, setEthAmount] = useState(0);
  const [usdAmount, setUsdAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [entityPrice, setEntityPrice] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);

  //Modal State Trigger
  const openModal = content => {
    setModalContent(content);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  //fetching/setting Price States
  const fetchEthAmount = useCallback(async () => {
    try {
      const nukeFundContract = new ethers.Contract(
        contractsConfig.nukeContractAddress,
        contractsConfig.nukeFundContractAbi,
        infuraProvider
      );
      const balance = await nukeFundContract.getFundBalance();
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error fetching ETH amount from nuke fund:', error);
      return 0;
    }
  }, [infuraProvider]);

  const fetchEthToUsdRate = async () => {
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
      );
      return response.data.ethereum.usd;
    } catch (error) {
      console.error('Error fetching ETH to USD rate:', error);
    }
    return null; 
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      const amount = await fetchEthAmount();
      const rate = await fetchEthToUsdRate();
      if (amount && rate) {
        const usdValue = amount * rate;
        setEthAmount(Number(amount).toFixed(2));
        setUsdAmount(Number(usdValue).toFixed(2));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchEthAmount]);

  //Calculate Entity Attributes
  function calculateEntityAttributes(entropy) {
    const performanceFactor = entropy.toString() % 10;
    const lastTwoDigits = entropy.toString() % 100;
    const forgePotential = Math.floor(lastTwoDigits / 10);
    const nukeFactor = Number((entropy / 40000).toFixed(2));
    let role;
    const result = entropy.toString() % 3;
    if (result === 0) {
      role = 'Forger';
    } else {
      role = 'Merger';
    }
    return { role, forgePotential, nukeFactor, performanceFactor };
  }

  //Entity Price For Mint
  useEffect(() => {
    const getLatestEntityPrice = async () => {
      if (!infuraProvider) return;
      setIsLoading(true);
      try {
        const mintContract = new ethers.Contract(
          contractsConfig.traitForgeNftAddress,
          contractsConfig.traitForgeNftAbi,
          infuraProvider
        );
        const mintPrice = await mintContract.calculateMintPrice();
        const priceInEth = ethers.formatEther(mintPrice);
        setEntityPrice(priceInEth);
      } catch (error) {
        console.error('Error fetching entity price:', error);
      } finally {
        setIsLoading(false);
      }
    };
    getLatestEntityPrice();
  }, []);

  // Event Listener for Stats
  //const subscribeToMintEvent = () => {
  //if (!infuraProvider) return;
  //
  //  const mintContract = new ethers.Contract(
  //    contractsConfig.traitForgeNftAddress,
  //    contractsConfig.traitForgeNftAbi,
  //    infuraProvider
  //  );
  //  const nukeContract = new ethers.Contract(
  //    contractsConfig.nukeContractAddress,
  //    contractsConfig.nukeFundContractAbi,
  //    infuraProvider
  //  );
  //
  //  const handleEvent = (type) => async (...args) => {
  //    const event = args[args.length - 1];
  //    const transactionHash = event.transactionHash;
  //    const transaction = await infuraProvider.getTransaction(transactionHash);
  //    const valueInEth = ethers.utils.formatEther(transaction.value);
  //    const newTransaction = {
  //      type,
  //      from: 'Smart Contract',
  //      to: args[0],
  //      amount: valueInEth,
  //      timestamp: new Date().getTime(),
  //      transactionHash,
  //    };
  //    setTransactions(prevTransactions => {
  //    const updatedTransactions = [newTransaction, ...prevTransactions];
  //    localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
  //    return updatedTransactions;
  //    });
  //  };
  //
  //  mintContract.on('Minted', handleEvent('Minted'));
  //  mintContract.on('Entitybred', handleEvent('Entitybred'));
  //  nukeContract.on('Nuked', handleEvent('Nuked'));
  //
  //  return () => {
  //  mintContract.off('Minted', handleEvent('Minted'));
  //  mintContract.off('Entitybred', handleEvent('Entitybred'));
  //  nukeContract.off('Nuked', handleEvent('Nuked'));
  //  };
  //};
  //
  //useEffect(() => {
  // Subscribe to mint events
  //const unsubscribe = subscribeToMintEvent();
  // return () => {
  //   unsubscribe();
  //};
  //}, [infuraProvider]);

  return (
    <AppContext.Provider
      value={{
        isOpen,
        modalContent,
        ethAmount,
        usdAmount,
        entityPrice,
        isLoading,
        transactions,
        infuraProvider,
        openModal,
        //subscribeToMintEvent,
        closeModal,
        setIsLoading,
        calculateEntityAttributes,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

const useContextState = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useContext must be used within a ContextProvider');
  }
  return context;
};

export { useContextState, ContextProvider };
