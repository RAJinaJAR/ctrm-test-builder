
import React, { useRef, useState, useEffect } from 'react';
import { FrameAssetData, BoxType, InputBox as InputBoxData, Hotspot } from '../types';

interface TestFramePlayerProps {
  frame: FrameAssetData;
  onInputChange: (boxId: string, value: string) => void;
  onHotspotInteraction: (hotspot: Hotspot) => void;
  onFrameClickMistake: () => void;
  onInputBlur?: () => void;
  userInputsForFrame: Record<string, string>;
  userHotspotsClickedForFrame: Record<string, boolean>;
  lastCorrectOrderForFrame: number;
  showResults: boolean;
  justClickedHotspotId?: string | null;
  justClickedIncorrectHotspotId?: string | null;
}

const TestFramePlayer: React.FC<TestFramePlayerProps> = ({
  frame,
  onInputChange,
  onHotspotInteraction,
  onFrameClickMistake,
  onInputBlur,
  userInputsForFrame,
  userHotspotsClickedForFrame,
  lastCorrectOrderForFrame,
  showResults,
  justClickedHotspotId,
  justClickedIncorrectHotspotId,
}) => {
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [showMistakeFlash, setShowMistakeFlash] = useState(false);

  useEffect(() => {
    // Reset mistake flash when frame changes
    setShowMistakeFlash(false);
  }, [frame.id]);

  const handleContainerClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (showResults) return;

    // Check if the click target is the container itself or the image,
    // and not propagated from an interactive box.
    const targetElement = event.target as HTMLElement;
    const isClickOnHotspot = targetElement.closest('[role="button"][data-interactive-type="hotspot"]');
    const isClickOnInputArea = targetElement.closest('[data-interactive-type="input-area"]');

    if (!isClickOnHotspot && !isClickOnInputArea) {
       // Only trigger mistake if hotspots exist on this frame
       if (frame.boxes.some(b => b.type === BoxType.HOTSPOT)) {
        onFrameClickMistake();
        setShowMistakeFlash(true);
        setTimeout(() => setShowMistakeFlash(false), 700); // Duration of the flash animation
       }
    }
  };


  return (
    <div
      ref={imageContainerRef}
      className={`relative w-full bg-gray-700 shadow-lg rounded-lg overflow-hidden ${showMistakeFlash ? 'mistake-flash-animation' : ''}`}
      style={{
        aspectRatio: `${frame.originalWidth} / ${frame.originalHeight}`,
        maxWidth: `${frame.originalWidth}px`, 
        margin: '0 auto' 
      }}
      onClick={handleContainerClick} 
      role="group" 
      aria-label={`Test frame content area. Frame ID: ${frame.id.substring(0,8)}`}
    >
      <img
        src={frame.imageDataUrl}
        alt={`Test Frame ${frame.id.substring(0, 8)}`}
        className="block w-full h-auto"
        draggable="false"
      />
      {frame.boxes.map((box) => {
        const boxStyle: React.CSSProperties = {
          position: 'absolute',
          left: `${box.x}%`,
          top: `${box.y}%`,
          width: `${box.w}%`,
          height: `${box.h}%`,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease-in-out',
        };
        
        if (box.type === BoxType.HOTSPOT) {
          const hotspot = box as Hotspot;
          const wasClicked = userHotspotsClickedForFrame[hotspot.id];
          const isDisabled = showResults || wasClicked;

          let hotspotClasses = '';
          let icon = null;
          let orderBadge = (
            <div className={`absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-xs font-bold rounded-full flex items-center justify-center shadow-md border border-white/50
              ${wasClicked ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}`}>
              {hotspot.order}
            </div>
          );

          if (showResults) {
            hotspotClasses = 'cursor-default';
            if (wasClicked) {
              hotspotClasses += ' bg-green-500/40';
              icon = <span className="text-white text-3xl font-bold select-none" aria-label="Correctly clicked">✓</span>;
            } else {
              hotspotClasses += ' bg-red-500/40';
              icon = <span className="text-white text-3xl font-bold select-none" aria-label="Missed hotspot">✗</span>;
              orderBadge = (
                <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-xs font-bold rounded-full flex items-center justify-center shadow-md border border-white/50 bg-red-600 text-white">
                  {hotspot.order}
                </div>
              );
            }
          } else { // Active test mode
            if (wasClicked) {
                hotspotClasses = 'cursor-default bg-green-500/50 outline outline-2 outline-green-600';
                icon = <span className="text-white text-2xl font-bold select-none" aria-label="Correctly clicked">✓</span>;
            } else {
                hotspotClasses = 'cursor-pointer';
            }
          }

          if (justClickedHotspotId === hotspot.id) {
            hotspotClasses = 'cursor-default outline outline-4 outline-green-400 bg-green-500/50';
            icon = <span className="text-white text-2xl font-bold select-none" aria-label="Correctly clicked">✓</span>;
          }
          
          if (justClickedIncorrectHotspotId === hotspot.id) {
            hotspotClasses += ' outline outline-4 outline-red-500';
          }

          return (
            <div
              key={hotspot.id}
              style={boxStyle}
              className={hotspotClasses}
              onClick={(e) => {
                e.stopPropagation(); 
                if (!isDisabled) { 
                  onHotspotInteraction(hotspot);
                }
              }}
              onKeyDown={(e) => { 
                if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) {
                  e.stopPropagation();
                  onHotspotInteraction(hotspot);
                }
              }}
              title={hotspot.label}
              role="button"
              tabIndex={isDisabled ? -1 : 0}
              aria-label={`Hotspot: ${hotspot.label}`}
              data-interactive-type="hotspot" 
            >
              {icon}
              {(showResults || wasClicked) && orderBadge}
            </div>
          );
        }

        if (box.type === BoxType.INPUT) {
          const userAnswer = userInputsForFrame[box.id] ?? '';
          const expectedAnswer = (box as InputBoxData).expected;
          let isCorrect = false;
          let expectedDisplayClass = 'bg-gray-500 text-white';
          let ringClass = '';
          let inputBorderClass = 'border-blue-500';

          if (showResults) {
            isCorrect = userAnswer.trim().toLowerCase() === expectedAnswer.trim().toLowerCase();
            if (isCorrect) {
              expectedDisplayClass = 'bg-green-600 text-white';
              ringClass = 'ring-2 ring-offset-1 ring-green-500';
              inputBorderClass = 'border-green-500';
            } else {
              expectedDisplayClass = 'bg-red-600 text-white';
              ringClass = 'ring-2 ring-offset-1 ring-red-500';
              inputBorderClass = 'border-red-500';
            }
          }

          return (
            <div
              key={box.id}
              style={{...boxStyle, flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start', padding: '1px'}} 
              className={`border-2 bg-transparent ${showResults ? ringClass + ' ' + inputBorderClass : inputBorderClass } rounded-sm`}
              onClick={(e) => e.stopPropagation()} 
              data-interactive-type="input-area"
            >
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => !showResults && onInputChange(box.id, e.target.value)}
                onBlur={() => !showResults && onInputBlur?.()}
                readOnly={showResults}
                placeholder={!showResults ? box.label : ''} 
                title={box.label}
                aria-label={`Input for ${box.label}. ${showResults ? `Your answer: ${userAnswer || 'empty'}. Expected: ${expectedAnswer}.` : ''}`}
                className={`w-full h-full p-1 text-sm bg-blue-100/80 focus:bg-blue-200/90 outline-none border-none placeholder-gray-600 text-black
                            ${showResults ? 'placeholder-gray-700 font-medium' : ''} rounded-sm`}
              />
               {showResults && (
                <div className={`absolute -bottom-6 left-0 text-xs px-1 py-0.5 rounded-sm shadow-md
                  whitespace-nowrap bg-opacity-90 max-w-[calc(100%+40px)] overflow-visible z-10 ${expectedDisplayClass}`}
                  aria-live="polite"
                >
                  {isCorrect && userAnswer.trim() === '' && expectedAnswer.trim() === '' ? 'Correct (empty)' :
                   isCorrect ? `Correct! Expected: "${expectedAnswer}"` :
                   userAnswer.trim() === '' ? `Incorrect (empty). Expected: "${expectedAnswer}"` :
                   `Incorrect. User: "${userAnswer}". Expected: "${expectedAnswer}"`
                  }
                </div>
              )}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

export default TestFramePlayer;
