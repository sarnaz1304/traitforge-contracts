import React, { useEffect, useState } from 'react';

import styles from '@/styles/honeypot.module.scss';
import { contractsConfig } from '@/utils/contractsConfig';
import { HoneyPotHeader } from '@/screens/honey-pot/HoneyPotHeader';
import { EntityCard } from '@/components';
import { HoneyPotBody } from '@/screens/honey-pot/HoneyPotBody';
import { NukeEntity } from '@/screens/honey-pot/NukeEntity';
import { useContextState } from '@/utils/context';
import { createContract } from '@/utils/utils';

const HoneyPot = () => {
  const { ownerEntities, walletProvider } = useContextState();
  const [selectedForNuke, setSelectedForNuke] = useState(null);
  const [step, setStep] = useState('one');
  const handleStep = (nextStep) => setStep(nextStep);

  const nukeEntity = async (tokenId) => {
    if (!walletProvider) {
      alert('Please connect your wallet first.');
      return;
    }
    try {
      const tradeContract = await createContract(
        walletProvider,
        contractsConfig.nukeContractAddress,
        contractsConfig.nukeFundContractAbi
      );
      const transaction = await tradeContract.nuke(tokenId);
      await transaction.wait();
      alert('Entity Nuked successfully!');
    } catch (error) {
      console.error('Nuke failed:', error);
      alert('Nuke failed. Please try again.');
    }
  };

  let content;

  switch (step) {
    case 'three':
      content = (
       <NukeEntity selectedForNuke={selectedForNuke} nukeEntity={nukeEntity}/>
      );
      break;
    case 'two':
      content = (
        <div className="overflow-y-scroll flex-1 pt-8">
          <div className="grid grid-cols-3 lg:grid-cols-5 lg:px-20 gap-x-[15px] gap-y-5 md:gap-y-10">
            {ownerEntities.map(entity => (
              <EntityCard
                key={entity}
                tokenId={entity}
                borderType='purple'
                onSelect={() => {
                  setSelectedForNuke(entity);
                  setStep('three');
                  console.log("selected entity for nuke:", entity);
                }}
              />
            ))}
          </div>
        </div>
      );
      break;
    default:
      content = <HoneyPotBody handleStep={() => setStep('two')} />;
  }

  return (
    <div className={styles.honeyPotContainer}>
      <div className="container flex flex-col h-full">
        <HoneyPotHeader step={step} handleStep={handleStep} />
        {content}
      </div>
    </div>
  );
};

export default HoneyPot;
