import React, { useRef, useState, useCallback, useEffect } from 'react';
import { FrameAssetData, InteractiveBoxData } from '../types';
import InteractiveBox from './InteractiveBox';

interface FrameDisplayProps {
  frame: FrameAssetData | null;
  selectedBoxId: string | null;
  onSelectBox: (id: string) => void;
  onUpdateBox: (id: string, updates: Partial<InteractiveBoxData>) => void;
  onImageClick?: () => void; // For deselecting boxes
  onAddHotspot: (pos: {x: number, y: number}) => void;
  onAddInputField: (box: {x: number, y: number, w: number, h: number}) => void;
  disabled?: boolean; // General disable for loading etc.
}

const FrameDisplay: React.FC<FrameDisplayProps> = ({ frame, selectedBoxId, onSelectBox, onUpdateBox, onImageClick, onAddHotspot, onAddInputField, disabled }) => {
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; clientX: number; clientY: number; time: number; } | null>(null);
  const [drawingBox, setDrawingBox] = useState<{ x: number; y: number; w: number; h: number; } | null>(null);


  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStartRef.current || !imageContainerRef.current) return;
    
    e.preventDefault();
    
    const containerRect = imageContainerRef.current.getBoundingClientRect();
    const currentX = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    const currentY = ((e.clientY - containerRect.top) / containerRect.height) * 100;
    
    const startX = dragStartRef.current.x;
    const startY = dragStartRef.current.y;
    
    const newBox = {
        x: Math.min(startX, currentX),
        y: Math.min(startY, currentY),
        w: Math.abs(currentX - startX),
        h: Math.abs(currentY - startY),
    };

    setDrawingBox(newBox);
  }, []);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);

    if (!dragStartRef.current || !imageContainerRef.current) return;

    const { x, y, clientX, clientY, time } = dragStartRef.current;
    
    const duration = Date.now() - time;
    const distance = Math.hypot(e.clientX - clientX, e.clientY - clientY);
    
    const CLICK_THRESHOLD_MS = 250;
    const DRAG_THRESHOLD_PX = 5;
    const MIN_BOX_DIM_PERCENT = 1;

    // Recalculate final box dimensions on mouse up
    const containerRect = imageContainerRef.current.getBoundingClientRect();
    const finalMouseX = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    const finalMouseY = ((e.clientY - containerRect.top) / containerRect.height) * 100;
    const finalBox = {
        x: Math.min(x, finalMouseX),
        y: Math.min(y, finalMouseY),
        w: Math.abs(finalMouseX - x),
        h: Math.abs(finalMouseY - y),
    };


    if (duration < CLICK_THRESHOLD_MS && distance < DRAG_THRESHOLD_PX) {
        onAddHotspot({ x, y });
    } else if (finalBox.w > MIN_BOX_DIM_PERCENT && finalBox.h > MIN_BOX_DIM_PERCENT) {
        onAddInputField(finalBox);
    }
    
    dragStartRef.current = null;
    setDrawingBox(null);
  }, [onAddHotspot, onAddInputField, handleMouseMove]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const effectivelyDisabled = disabled || !frame?.includeInTest;
    if (effectivelyDisabled || e.button !== 0 || !imageContainerRef.current) return;

    // Only start drawing if the click is directly on the image, not an existing box.
    // InteractiveBox handles its own events and stops propagation, so this check is an extra safeguard.
    const targetIsImage = e.target === imageContainerRef.current?.querySelector('img');
    if (!targetIsImage) return;

    onImageClick?.();
    e.preventDefault();

    const containerRect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    const y = ((e.clientY - containerRect.top) / containerRect.height) * 100;

    dragStartRef.current = {
        x,
        y,
        clientX: e.clientX,
        clientY: e.clientY,
        time: Date.now(),
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);


  if (!frame) {
    return (
      <div className="w-full aspect-video bg-gray-200 flex items-center justify-center text-gray-500 rounded-lg shadow-inner">
        No frame to display. Upload a video and process frames.
      </div>
    );
  }
  
  const effectivelyDisabled = disabled || !frame.includeInTest;
  const isExcluded = !frame.includeInTest;
  
  const editingDisabledOverlayMessage = disabled && !isExcluded ? "Editing disabled." : null;


  return (
    <div className="w-full">
      <div 
        ref={imageContainerRef} 
        className={`relative w-full bg-gray-800 rounded-lg overflow-hidden select-none ${!isExcluded ? 'shadow-xl' : ''} ${!effectivelyDisabled ? 'cursor-crosshair' : ''}`}
        onMouseDown={handleMouseDown} 
      >
        <img
          src={frame.imageDataUrl}
          alt={`Frame ${frame.id}`}
          className={`block w-full h-auto ${effectivelyDisabled ? 'opacity-90' : ''}`}
          draggable="false"
        />
        {editingDisabledOverlayMessage && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-lg font-semibold p-4 text-center z-10">
            {editingDisabledOverlayMessage}
          </div>
        )}
        {drawingBox && (
          <div
            className="absolute border-2 border-dashed border-yellow-400 bg-yellow-400/20 pointer-events-none z-40"
            style={{
                left: `${drawingBox.x}%`,
                top: `${drawingBox.y}%`,
                width: `${drawingBox.w}%`,
                height: `${drawingBox.h}%`,
            }}
          />
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
      {isExcluded && (
          <div className="mt-2 text-center text-sm text-gray-600">
            This frame is excluded from the test. Editing is disabled.
          </div>
      )}
    </div>
  );
};

export default FrameDisplay;