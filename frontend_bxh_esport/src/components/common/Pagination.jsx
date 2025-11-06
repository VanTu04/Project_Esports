import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { generatePaginationArray } from '../../utils/helpers';

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisible = 5,
}) => {
  const pages = generatePaginationArray(currentPage, totalPages, maxVisible);

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-dark-400 border-t border-primary-700/20">
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className={clsx(
            'p-2 rounded-md border transition-colors',
            currentPage === 1
              ? 'border-dark-300 text-gray-600 cursor-not-allowed'
              : 'border-primary-700/30 text-gray-300 hover:bg-dark-300 hover:border-primary-600'
          )}
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-1">
          {pages[0] > 1 && (
            <>
              <PageButton page={1} currentPage={currentPage} onClick={onPageChange} />
              {pages[0] > 2 && <span className="px-2 text-gray-500">...</span>}
            </>
          )}

          {pages.map((page) => (
            <PageButton
              key={page}
              page={page}
              currentPage={currentPage}
              onClick={onPageChange}
            />
          ))}

          {pages[pages.length - 1] < totalPages && (
            <>
              {pages[pages.length - 1] < totalPages - 1 && (
                <span className="px-2 text-gray-500">...</span>
              )}
              <PageButton
                page={totalPages}
                currentPage={currentPage}
                onClick={onPageChange}
              />
            </>
          )}
        </div>

        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className={clsx(
            'p-2 rounded-md border transition-colors',
            currentPage === totalPages
              ? 'border-dark-300 text-gray-600 cursor-not-allowed'
              : 'border-primary-700/30 text-gray-300 hover:bg-dark-300 hover:border-primary-600'
          )}
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="text-sm text-gray-400">
        Trang {currentPage} / {totalPages}
      </div>
    </div>
  );
};

const PageButton = ({ page, currentPage, onClick }) => (
  <button
    onClick={() => onClick(page)}
    className={clsx(
      'px-3 py-1 rounded-md text-sm font-medium transition-colors',
      page === currentPage
        ? 'bg-gradient-gold text-white'
        : 'text-gray-300 hover:bg-dark-300'
    )}
  >
    {page}
  </button>
);

export default Pagination;