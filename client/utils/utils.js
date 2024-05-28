import { ethers } from 'ethers';
import { toast } from 'react-toastify';

import { contractsConfig } from './contractsConfig';

export function calculateEntityAttributes(paddedEntropy) {
  const paddedEntropyNumber = Number(paddedEntropy);
  const performanceFactor = paddedEntropyNumber % 10;
  const lastTwoDigits = paddedEntropyNumber % 100;
  const forgePotential = Math.floor(lastTwoDigits / 10);
  const nukeFactor = Number((paddedEntropyNumber / 40000).toFixed(3));
  let role;
  const result = paddedEntropyNumber % 3;
  if (result === 0) {
    role = 'Forger';
  } else {
    role = 'Merger';
  }
  return { role, forgePotential, nukeFactor, performanceFactor };
}

export async function createContract(walletProvider, address, abi) {
  const ethersProvider = new ethers.BrowserProvider(walletProvider);
  const signer = await ethersProvider.getSigner();
  const mintContract = new ethers.Contract(address, abi, signer);
  return mintContract;
}

export const getEntitiesHook = async (infuraProvider) => {
  const contract = new ethers.Contract(
    contractsConfig.entityMergingAddress,
    contractsConfig.entityMergingContractAbi,
    infuraProvider
  );
  const listings = await contract.fetchListings();
  console.log("forging listings are:", listings)
  return listings;
};


export const getUpcomingMintsHook = async (
  startSlot,
  startNumberIndex,
  infuraProvider
) => {
  const contract = new ethers.Contract(
    contractsConfig.entropyGeneratorContractAddress,
    contractsConfig.entropyGeneratorContractAbi,
    infuraProvider
  );

  let allEntropies = [];
  let maxSlot = 770;
  let maxCount = 50;

  try {
    while (allEntropies.length < maxCount && startSlot < maxSlot) {
      const promises = [];
      for (
        let numberIndex = startNumberIndex;
        numberIndex < 13 && allEntropies.length < maxCount;
        numberIndex++
      ) {
        const promise = contract
          .getPublicEntropy(startSlot, numberIndex)
          .then(value => parseInt(value, 10))
          .catch(error => {
            return 0;
          });
        promises.push(promise);
      }
      const results = await Promise.all(promises);
      allEntropies = allEntropies.concat(results);
      startSlot++;
      startNumberIndex = 0;
    }
  } catch (error) {
    console.error('Unhandled error:', error);
  }

  return { allEntropies, maxCount };
};

export const getEntitiesForSaleHook = async infuraProvider => {
  const tradeContract = new ethers.Contract(
    contractsConfig.entityTradingContractAddress,
    contractsConfig.entityTradingAbi,
    infuraProvider
  );
  const [tokenIds, sellers, prices] = await tradeContract.fetchListedEntities();
  const listedEntities = tokenIds.map((tokenId, index) => ({
    tokenId: tokenId,
    seller: sellers[index],
    price: ethers.formatEther(prices[index]),
  }));
  console.log(listedEntities);
  return listedEntities;
};

export const getOwnersEntitiesHook = async walletProvider => {
  try {
    const ethersProvider = new ethers.BrowserProvider(walletProvider);
    const signer = await ethersProvider.getSigner();
    const address = await signer.getAddress();
    const TraitForgeContract = new ethers.Contract(
      contractsConfig.traitForgeNftAddress,
      contractsConfig.traitForgeNftAbi,
      ethersProvider
    );

    const balance = await TraitForgeContract.balanceOf(address);
    const fetchPromises = [];

    for (let i = 0; i < balance; i++) {
      fetchPromises.push(TraitForgeContract.tokenOfOwnerByIndex(address, i));
    }

    const entities = await Promise.all(fetchPromises);
    return entities;
  } catch (error) {
    console.error("Error fetching owner's entities:", error);
    throw error;
  }
};

export const getEntityEntropyHook = async (walletProvider, entity) => {
  console.log("getting entropy:");
  const ethersProvider = new ethers.BrowserProvider(walletProvider);
  const signer = await ethersProvider.getSigner();
  const TraitForgeContract = new ethers.Contract(
    contractsConfig.traitForgeNftAddress,
    contractsConfig.traitForgeNftAbi,
    signer
  );
  const entityEntropy = await TraitForgeContract.getTokenEntropy(entity);
  console.log("entity entropy is:", entityEntropy);
  return entityEntropy;
};

export const getEntityGeneration = async (walletProvider, listing) => {
  const ethersProvider = new ethers.BrowserProvider(walletProvider);
  const signer = await ethersProvider.getSigner();
  const TraitForgeContract = new ethers.Contract(
    contractsConfig.traitForgeNftAddress,
    contractsConfig.traitForgeNftAbi,
    signer
  );
  const entityGeneration = await TraitForgeContract.getTokenGeneration(listing);
  return entityGeneration.toString();
};

export const getCurrentGenerationHook = async infuraProvider => {
  const TraitForgeContract = new ethers.Contract(
    contractsConfig.traitForgeNftAddress,
    contractsConfig.traitForgeNftAbi,
    infuraProvider
  );
  const currentGeneration = await TraitForgeContract.getGeneration();
  console.log("current gen is", currentGeneration)
  return currentGeneration.toString();
};

export const getEntityGenerationHook = async (walletProvider, entity) => {
  const ethersProvider = new ethers.BrowserProvider(walletProvider);
  const signer = await ethersProvider.getSigner();
  const TraitForgeContract = new ethers.Contract(
    contractsConfig.traitForgeNftAddress,
    contractsConfig.traitForgeNftAbi,
    signer
  );
  const entityGeneration = await TraitForgeContract.getTokenGeneration(entity);
  return entityGeneration;
};

export const isForger = async (walletProvider, entity) => {
  const ethersProvider = new ethers.BrowserProvider(walletProvider);
  const signer = await ethersProvider.getSigner();
  const TraitForgeContract = new ethers.Contract(
    contractsConfig.traitForgeNftAddress,
    contractsConfig.traitForgeNftAbi,
    signer
  );
  const isForger = await TraitForgeContract.isForger(entity);
  return isForger;
};

export const calculateNukeFactor = async (walletProvider, entity) => {
  const ethersProvider = new ethers.BrowserProvider(walletProvider);
  const signer = await ethersProvider.getSigner();
  const nukeContract = new ethers.Contract(
    contractsConfig.nukeContractAddress,
    contractsConfig.nukeFundContractAbi,
    signer
  );
  const finalNukeFactor = await nukeContract.calculateNukeFactor(entity);
  const formattedNukeFactor = (Number(finalNukeFactor) / 10000)
    .toFixed(4)
    .toString();
  return formattedNukeFactor;
};

export const approveNFTForTrading = async (tokenId, walletProvider) => {
  if (!walletProvider) {
    alert('Please connect your wallet first.');
    return;
  }
  try {
    const nftContract = await createContract(
      walletProvider,
      contractsConfig.traitForgeNftAddress,
      contractsConfig.traitForgeNftAbi
    );
    const transaction = await nftContract.approve(
      contractsConfig.entityTradingContractAddress,
      tokenId
    );
    await transaction.wait();

    toast.success('NFT approved successfully');
  } catch (error) {
    toast.error(`Approval failed. Please try again`);
  }
};

export const approveNFTForNuking = async (tokenId, walletProvider) => {
  if (!walletProvider) {
    alert('Please connect your wallet first.');
    return;
  }
  try {
    const nftContract = await createContract(
      walletProvider,
      contractsConfig.traitForgeNftAddress,
      contractsConfig.traitForgeNftAbi
    );
    const transaction = await nftContract.approve(
      contractsConfig.nukeContractAddress,
      tokenId
    );
    await transaction.wait();
    toast.success('NFT approved successfully');
  } catch (error) {
    toast.error(`Approval failed. Please try again.`);
  }
};

export const mintEntityHandler = async (walletProvider, open, entityPrice) => {
  if (!walletProvider) return open();

  try {
    const mintContract = await createContract(
      walletProvider,
      contractsConfig.traitForgeNftAddress,
      contractsConfig.traitForgeNftAbi
    );
    console.log(entityPrice)
    const transaction = await mintContract.mintToken({
      value: ethers.parseEther(entityPrice),
      gasLimit: 5000000,
    });
    await transaction.wait();
    toast.success('Entity minted successfully');
  } catch (error) {
    toast.error(`Minting entity failed`);
  }
};

export const mintBatchEntityHandler = async (
  walletProvider,
  open,
  budgetAmount
) => {
  if (!walletProvider) return open();
  try {
    const mintContract = await createContract(
      walletProvider,
      contractsConfig.traitForgeNftAddress,
      contractsConfig.traitForgeNftAbi
    );
    const transaction = await mintContract.mintWithBudget({
      value: ethers.parseEther(budgetAmount),
      gasLimit: 5000000,
    });
    await transaction.wait();
    toast.success('Entity minted successfully');
  } catch (error) {
    toast.error(`Minting entity failed`);
  }
};

export const shortenAddress = address => {
  // Ensure the address is in the correct format
  if (
    typeof address !== 'string' ||
    !address.startsWith('0x') ||
    address.length !== 42
  ) {
    throw new Error('Invalid Ethereum address');
  }

  // Extract the first four characters (including '0x')
  const firstPart = address.slice(0, 4);

  // Extract the last four characters
  const lastPart = address.slice(-4);

  // Combine the parts with '......' in between
  const shortenedAddress = `${firstPart}......${lastPart}`;

  return shortenedAddress;
};

export const getEntitiesListedByPlayer = async (walletProvider) => {
  const ethersProvider = new ethers.BrowserProvider(walletProvider);
  const signer = await ethersProvider.getSigner();
  const address = await signer.getAddress();
  
  const tradeContract = new ethers.Contract(
    contractsConfig.entityTradingContractAddress,
    contractsConfig.entityTradingAbi,
    signer
  );
  
  const forgeContract = new ethers.Contract(
    contractsConfig.entityMergingAddress,
    contractsConfig.entityMergingContractAbi,
    signer
  );
  const [tradeTokenIds, tradeSellers, tradePrices] = await tradeContract.fetchListedEntities();
  const [forgeTokenIds, forgeSellers, forgePrices] = await forgeContract.fetchListings();
  const listedEntities = [];
  
  for (let i = 0; i < tradeTokenIds.length; i++) {
    if (address === tradeSellers[i]) {
      listedEntities.push({
        tokenId: tradeTokenIds[i],
        seller: tradeSellers[i],
        price: ethers.formatEther(tradePrices[i]),
      });
    }
  }
  
  for (let i = 0; i < forgeTokenIds.length; i++) {
    if (address === forgeSellers[i]) {
      listedEntities.push({
        tokenId: forgeTokenIds[i],
        seller: forgeSellers[i],
        price: ethers.formatEther(forgePrices[i]),
      });
    }
  }
  
  return listedEntities;
};