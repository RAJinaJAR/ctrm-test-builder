import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { FrameAssetData, BoxType, InputBox as InputBoxData } from '../types';
import TestFramePlayer from './TestFramePlayer';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface TestPlayerProps {
  frames: FrameAssetData[];
  onExitTest: () => void;
}

interface UserAnswer {
  inputs: Record<string, string>; 
  hotspotsClicked: Record<string, boolean>; 
}

const TestPlayer: React.FC<TestPlayerProps> = ({ frames, onExitTest }) => {
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, UserAnswer>>(
    () => frames.reduce((acc, _, index) => {
      acc[index] = { inputs: {}, hotspotsClicked: {} };
      return acc;
    }, {} as Record<number, UserAnswer>)
  );
  const [showResults, setShowResults] = useState(false);
  const [justClickedHotspotId, setJustClickedHotspotId] = useState<string | null>(null);
  const [frameMistakes, setFrameMistakes] = useState<Record<number, boolean>>(
    () => frames.reduce((acc, _, index) => {
      acc[index] = false;
      return acc;
    }, {} as Record<number, boolean>)
  );


  const currentFrameData = frames[currentFrameIdx];
  const currentUserAnswerForFrame = userAnswers[currentFrameIdx];

  const handleInputChange = useCallback((boxId: string, value: string) => {
    setUserAnswers(prevAnswers => ({
      ...prevAnswers,
      [currentFrameIdx]: {
        ...prevAnswers[currentFrameIdx],
        inputs: {
          ...prevAnswers[currentFrameIdx].inputs,
          [boxId]: value,
        },
      },
    }));
  }, [currentFrameIdx]);

  const navigate = useCallback((direction: 'next' | 'prev') => {
    if (direction === 'next') {
      if (currentFrameIdx < frames.length - 1) {
        setCurrentFrameIdx(currentFrameIdx + 1);
      } else {
        setShowResults(true);
      }
    } else if (direction === 'prev') {
      if (currentFrameIdx > 0) {
        setCurrentFrameIdx(currentFrameIdx - 1);
      }
    }
  }, [currentFrameIdx, frames.length]);

  const handleHotspotInteraction = useCallback((boxId: string) => {
    if (showResults) return; // No interaction if showing results
    setUserAnswers(prevAnswers => ({
      ...prevAnswers,
      [currentFrameIdx]: {
        ...prevAnswers[currentFrameIdx],
        hotspotsClicked: {
          ...prevAnswers[currentFrameIdx].hotspotsClicked,
          [boxId]: true,
        },
      },
    }));
    setJustClickedHotspotId(boxId); 
    setTimeout(() => {
        navigate('next');
        setJustClickedHotspotId(null);
    }, 150);
  }, [currentFrameIdx, navigate, showResults]);

  const handleFrameClickMistake = useCallback(() => {
    if (showResults || !currentFrameData) return;
    // Only count as mistake if the frame actually has hotspots
    if (currentFrameData.boxes.some(box => box.type === BoxType.HOTSPOT)) {
      setFrameMistakes(prev => ({ ...prev, [currentFrameIdx]: true }));
    }
  }, [currentFrameIdx, showResults, currentFrameData]);

  const handleInputBlur = useCallback(() => {
    if (showResults || !currentFrameData) return;

    // Check if the frame is input-only and has at least one input box
    const isInputOnlyFrame = currentFrameData.boxes.length > 0 && currentFrameData.boxes.every(b => b.type === BoxType.INPUT);
    if (!isInputOnlyFrame) return;

    // Check if all inputs for the current frame are filled
    const inputBoxes = currentFrameData.boxes.filter(b => b.type === BoxType.INPUT);
    const currentAnswersForFrame = userAnswers[currentFrameIdx]?.inputs || {};
    const allInputsFilled = inputBoxes.every(box => (currentAnswersForFrame[box.id] || '').trim() !== '');

    if (allInputsFilled) {
      setTimeout(() => navigate('next'), 100);
    }
  }, [currentFrameData, currentFrameIdx, userAnswers, showResults, navigate]);


  const { score, totalPossible, framesWithMistakesCount } = useMemo(() => {
    let currentScore = 0;
    let currentTotalPossible = 0;
    let mistakesCount = 0;

    frames.forEach((frame, frameIndex) => {
      let hasHotspotsOnFrame = false;
      frame.boxes.forEach(box => {
        if (box.type === BoxType.INPUT) {
          currentTotalPossible++;
          const userAnswer = userAnswers[frameIndex]?.inputs[box.id] ?? '';
          if (userAnswer.trim().toLowerCase() === (box as InputBoxData).expected.trim().toLowerCase()) {
            currentScore++;
          }
        } else if (box.type === BoxType.HOTSPOT) {
          hasHotspotsOnFrame = true;
          currentTotalPossible++; 
          // Only score if no mistake click occurred on this frame AND this hotspot was clicked
          if (!frameMistakes[frameIndex] && userAnswers[frameIndex]?.hotspotsClicked[box.id]) {
            currentScore++;
          }
        }
      });
      if (hasHotspotsOnFrame && frameMistakes[frameIndex]) {
        mistakesCount++;
      }
    });
    return { score: currentScore, totalPossible: currentTotalPossible, framesWithMistakesCount: mistakesCount };
  }, [frames, userAnswers, frameMistakes]);


  if (!currentFrameData) {
    return (
      <div className="p-4 text-red-500 flex flex-col items-center justify-center min-h-screen">
          Error: Test data unavailable or test already exited.
          <button onClick={onExitTest} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
            Return to Editor
          </button>
      </div>
    );
  }
  
  const isLastFrame = currentFrameIdx === frames.length - 1;

  return (
    <div className="min-h-screen bg-slate-200 flex flex-col items-center p-4 md:p-8" role="application">
      <header className="w-full max-w-4xl mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-700">
            {showResults ? "Test Review" : "Test Mode"}
          </h1>
          <button
            onClick={onExitTest}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
            aria-label="Exit Test Mode"
          >
            Exit Test
          </button>
        </div>
        {!showResults && <p className="text-slate-600" aria-live="polite">Frame {currentFrameIdx + 1} of {frames.length}</p>}
         {showResults && <p className="text-slate-600" aria-live="polite">Reviewing Frame {currentFrameIdx + 1} of {frames.length}</p>}
      </header>

      <main className="w-full max-w-4xl bg-white p-4 sm:p-6 rounded-lg shadow-xl">
        <TestFramePlayer
          frame={currentFrameData}
          onInputChange={handleInputChange}
          onHotspotInteraction={handleHotspotInteraction}
          onFrameClickMistake={handleFrameClickMistake} 
          onInputBlur={handleInputBlur}
          userInputsForFrame={currentUserAnswerForFrame?.inputs || {}}
          userHotspotsClickedForFrame={currentUserAnswerForFrame?.hotspotsClicked || {}}
          showResults={showResults}
          justClickedHotspotId={justClickedHotspotId}
        />
      </main>

      <footer className="w-full max-w-4xl mt-6 flex flex-col items-center space-y-4">
        {showResults && (
            <div role="status" aria-live="assertive" className="p-4 bg-green-100 border border-green-300 rounded-md text-green-700 w-full text-center">
                <h3 className="text-xl font-bold">Test Complete!</h3>
                <p className="text-lg">Your score: {score} / {totalPossible}</p>
                {framesWithMistakesCount > 0 && (
                  <p className="text-sm text-red-600">Mistakes on {framesWithMistakesCount} frame{framesWithMistakesCount === 1 ? '' : 's'}.</p>
                )}
                <p className="text-sm mt-1">You can now review your answers using the Previous/Next buttons or Exit Test.</p>
            </div>
        )}

        <div className="flex justify-between items-center w-full">
            <button
                onClick={() => navigate('prev')}
                disabled={currentFrameIdx === 0}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-slate-500 rounded-md hover:bg-slate-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous Frame"
            >
                <ChevronLeftIcon className="w-5 h-5 mr-1" /> Previous
            </button>

            {!isLastFrame && !showResults && (
                 <button
                    onClick={() => navigate('next')}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                    aria-label="Next Frame"
                >
                    Next Frame <ChevronRightIcon className="w-5 h-5 ml-1 inline"/>
                </button>
            )}
            
            {isLastFrame && !showResults && (
                <button
                    onClick={() => navigate('next')} 
                    className="px-6 py-3 text-base font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                    aria-label="Finish Test and View Results"
                >
                    Finish Test & View Results
                </button>
            )}
            
            {showResults && !isLastFrame && (
                 <button
                    onClick={() => navigate('next')}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                    aria-label="Next Frame for Review"
                >
                    Next (Review) <ChevronRightIcon className="w-5 h-5 ml-1 inline"/>
                </button>
            )}

            {showResults && isLastFrame && (
                 <button
                    onClick={onExitTest}
                    className="px-6 py-3 text-base font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                    aria-label="Finish Review and Exit Test"
                >
                    Finish & Exit Review
                </button>
            )}
        </div>
      </footer>
    </div>
  );
};

export default TestPlayer;
