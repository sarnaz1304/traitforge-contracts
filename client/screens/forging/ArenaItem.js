import Image from 'next/image';
import classNames from 'classnames';

import { EntityCard } from '@/components';

export const ArenaItem = ({
  handleEntityListModal,
  image,
  selectedFromPool,
  selectedFromWallet,
  btnLabel,
  className,
  bottomImage,
}) => {
  if (selectedFromPool || selectedFromWallet)
    return <EntityCard entity={selectedFromPool} borderType="orange" />;

  const buttonWrapper = classNames('flex flex-col gap-y-5', className);

  return (
    <div className={buttonWrapper}>
      <button
        aria-label={btnLabel}
        className="items-center justify-center cursor-pointer h-auto"
        onClick={handleEntityListModal}
      >
        <Image
          src={image}
          alt="forge place holder"
          width={400}
          height={500}
          className="w-full h-full"
        />
      </button>
      <Image
        src={bottomImage}
        alt="forge place holder"
        width={400}
        height={500}
        className="w-full h-[100px] scale-[1.1] md:scale-[1.35]"
      />
    </div>
  );
};
