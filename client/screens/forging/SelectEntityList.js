import { useState } from 'react';
import { EntityCard, FiltersHeader } from '@/components';

export const SelectEntityList = ({
  entitiesForForging,
  handleSelectedFromPool,
}) => {
  const [sortOption, setSortOption] = useState('all');
  const [generationFilter, setGenerationFilter] = useState('');
  const [sortingFilter, setSortingFilter] = useState('');

  const handleSort = type => setSortOption(type);

  const handleFilterChange = (selectedOption, type) => {
    if (type === 'generation') {
      setGenerationFilter(selectedOption.value);
    } else if (type === 'sorting') {
      setSortingFilter(selectedOption.value);
    }
  };

  const getFilteredEntities = () => {
    const filteredEntities = generationFilter
      ? [...entitiesForForging].filter(
          entity => entity.generation.toString() === generationFilter
        )
      : [...entitiesForForging];

    return filteredEntities.sort((a, b) => {
      if (sortingFilter === 'price_high_to_low') {
        return parseFloat(b.price) - parseFloat(a.price);
      } else if (sortingFilter === 'price_low_to_high') {
        return parseFloat(a.price) - parseFloat(b.price);
      }
    });
  };

  const filteredEntities = getFilteredEntities();

  return (
    <div className="bg-dark-81 md:w-[80vw] h-[100vh] md:h-[85vh] 2xl:w-[70vw] md:rounded-[30px] py-10 px-5 flex flex-col">
      <div className="border-b border-white mb-10">
        <h3 className="text-center pb-10 text-[40px] uppercase font-bebas-neue">
          Select entity
        </h3>
        <FiltersHeader
          sortOption={sortOption}
          handleSort={handleSort}
          color="orange"
          handleFilterChange={(selectedOption, type) =>
            handleFilterChange(selectedOption, type)
          }
          generationFilter={generationFilter}
          sortingFilter={sortingFilter}
        />
      </div>
      <div className="flex-1 overflow-y-scroll">
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-x-[15px] gap-y-7 md:gap-y-10">
          {filteredEntities?.map((entity, index) => (
            <EntityCard
              key={entity.id}
              entity={entity}
              index={index}
              onClick={() => handleSelectedFromPool(entity)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
