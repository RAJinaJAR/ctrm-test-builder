
import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CopyIcon } from './icons';

interface FrameNavigatorProps {
  currentFrameIndex: number;
  totalFrames: number;
  isCurrentFrameIncluded: boolean;
  onToggleFrameInclusion: (included: boolean) => void;
  onPrev: () => void;
  onNext: () => void;
  onDuplicateFrame: () => void;
  disabled?: boolean;
}

const FrameNavigator: React.FC<FrameNavigatorProps> = ({
  currentFrameIndex,
  totalFrames,
  isCurrentFrameIncluded,
  onToggleFrameInclusion,
  onPrev,
  onNext,
  onDuplicateFrame,
  disabled,
}) => {
  if (totalFrames === 0) return null;

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onToggleFrameInclusion(event.target.checked);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 sm:space-x-4 my-4 p-3 bg-white rounded-md shadow">
      <div className="flex items-center space-x-2">
        <button
          onClick={onPrev}
          disabled={currentFrameIndex === 0 || disabled}
          className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous Frame"
        >
          <ChevronLeftIcon className="w-6 h-6 text-gray-700" />
        </button>
        <span className="text-gray-700 font-medium whitespace-nowrap">
          Frame {currentFrameIndex + 1} of {totalFrames}
        </span>
        <button
          onClick={onNext}
          disabled={currentFrameIndex === totalFrames - 1 || disabled}
          className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Next Frame"
        >
          <ChevronRightIcon className="w-6 h-6 text-gray-700" />
        </button>
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={onDuplicateFrame}
          disabled={disabled}
          className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Duplicate Frame"
        >
          <CopyIcon className="w-4 h-4 mr-2" />
          Duplicate
        </button>
        <div className="flex items-center">
            <input
              type="checkbox"
              id={`include-frame-${currentFrameIndex}`}
              checked={isCurrentFrameIncluded}
              onChange={handleCheckboxChange}
              disabled={disabled}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:opacity-70"
            />
            <label
              htmlFor={`include-frame-${currentFrameIndex}`}
              className={`ml-2 text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'}`}
            >
              Include in Test
            </label>
        </div>
      </div>
    </div>
  );
};

export default FrameNavigator;
