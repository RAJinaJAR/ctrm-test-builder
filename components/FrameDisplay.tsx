import React, { useRef } from 'react';
import { FrameAssetData, InteractiveBoxData } from '../types';
import InteractiveBox from './InteractiveBox';

interface FrameDisplayProps {
  frame: FrameAssetData | null;
  selectedBoxId: string | null;
  onSelectBox: (id: string) => void;
  onUpdateBox: (id: string, updates: Partial<InteractiveBoxData>) => void;
  onImageClick?: () => void; // For deselecting boxes
  disabled?: boolean; // General disable for loading etc.
}

const FrameDisplay: React.FC<FrameDisplayProps> = ({ frame, selectedBoxId, onSelectBox, onUpdateBox, onImageClick, disabled }) => {
  const imageContainerRef = useRef<HTMLDivElement>(null);

  if (!frame) {
    return (
      <div className="w-full aspect-video bg-gray-200 flex items-center justify-center text-gray-500 rounded-lg shadow-inner">
        No frame to display. Upload a video and process frames.
      </div>
    );
  }
  
  // Specific disable if frame is not included in test, overriding general disabled prop only if !frame.includeInTest
  const effectivelyDisabled = disabled || !frame.includeInTest;
  const overlayMessage = !frame.includeInTest 
    ? "This frame is excluded from the test. Editing is disabled." 
    : effectivelyDisabled ? "Editing disabled." : null;


  return (
    <div 
      ref={imageContainerRef} 
      className="relative w-full bg-gray-800 shadow-xl rounded-lg overflow-hidden"
      onClick={effectivelyDisabled ? undefined : onImageClick} 
    >
      <img
        src={frame.imageDataUrl}
        alt={`Frame ${frame.id}`}
        className={`block w-full h-auto ${effectivelyDisabled ? 'opacity-50' : ''}`}
        draggable="false"
      />
      {overlayMessage && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-lg font-semibold p-4 text-center z-10">
          {overlayMessage}
        </div>
      )}
      {frame.boxes.map((box) => (
        <InteractiveBox
          key={box.id}
          boxData={box}
          isSelected={box.id === selectedBoxId && !effectivelyDisabled}
          onSelect={onSelectBox}
          onUpdate={onUpdateBox}
          imageContainerRef={imageContainerRef}
          disabled={effectivelyDisabled}
        />
      ))}
    </div>
  );
};

export default FrameDisplay;
