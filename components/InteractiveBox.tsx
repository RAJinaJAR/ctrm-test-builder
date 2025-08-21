
import React, { useRef, useState, useCallback } from 'react';
import { InteractiveBoxData, BoxType } from '../types';
import { BOX_COLORS, SELECTED_BOX_BORDER_COLOR } from '../constants';

interface InteractiveBoxProps {
  boxData: InteractiveBoxData;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<InteractiveBoxData>) => void;
  imageContainerRef: React.RefObject<HTMLDivElement>; // Ref to the image container for bounds
  disabled?: boolean;
}

type ResizeDirection = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e';

const InteractiveBox: React.FC<InteractiveBoxProps> = ({ boxData, isSelected, onSelect, onUpdate, imageContainerRef, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<ResizeDirection | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0, boxX: 0, boxY: 0 });
  const resizeStartDim = useRef({ w: 0, h: 0, x: 0, y: 0, mouseX: 0, mouseY: 0});

  const boxStyle = {
    left: `${boxData.x}%`,
    top: `${boxData.y}%`,
    width: `${boxData.w}%`,
    height: `${boxData.h}%`,
  };

  const { bg, border } = BOX_COLORS[boxData.type];
  const selectedClass = isSelected ? SELECTED_BOX_BORDER_COLOR : border;

  const handleMouseDownDrag = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0 || !imageContainerRef.current) return; // Only left click
    e.stopPropagation(); // Prevent image click if any
    onSelect(boxData.id);
    setIsDragging(true);
    const containerRect = imageContainerRef.current.getBoundingClientRect();
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      boxX: (boxData.x / 100) * containerRect.width,
      boxY: (boxData.y / 100) * containerRect.height,
    };
    document.body.style.cursor = 'grabbing';
  }, [boxData.id, boxData.x, boxData.y, onSelect, imageContainerRef, disabled]);
  
  const handleMouseDownResize = useCallback((e: React.MouseEvent<HTMLDivElement>, direction: ResizeDirection) => {
    if (disabled || e.button !== 0 || !imageContainerRef.current) return;
    e.stopPropagation();
    onSelect(boxData.id);
    setIsResizing(direction);
    const containerRect = imageContainerRef.current.getBoundingClientRect();
    resizeStartDim.current = {
        w: (boxData.w / 100) * containerRect.width,
        h: (boxData.h / 100) * containerRect.height,
        x: (boxData.x / 100) * containerRect.width,
        y: (boxData.y / 100) * containerRect.height,
        mouseX: e.clientX,
        mouseY: e.clientY,
    };
    document.body.style.cursor = getComputedStyle(e.target as Element).cursor || 'default';
  }, [boxData.id, boxData.x, boxData.y, boxData.w, boxData.h, onSelect, imageContainerRef, disabled]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!imageContainerRef.current) return;
    const containerRect = imageContainerRef.current.getBoundingClientRect();
    
    if (isDragging) {
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;
      
      let newXPercent = ((dragStartPos.current.boxX + deltaX) / containerRect.width) * 100;
      let newYPercent = ((dragStartPos.current.boxY + deltaY) / containerRect.height) * 100;

      // Clamp within bounds (0% to 100% - width/height)
      newXPercent = Math.max(0, Math.min(newXPercent, 100 - boxData.w));
      newYPercent = Math.max(0, Math.min(newYPercent, 100 - boxData.h));
      
      onUpdate(boxData.id, { x: newXPercent, y: newYPercent });
    } else if (isResizing) {
        const dx = e.clientX - resizeStartDim.current.mouseX;
        const dy = e.clientY - resizeStartDim.current.mouseY;

        let newX = resizeStartDim.current.x;
        let newY = resizeStartDim.current.y;
        let newW = resizeStartDim.current.w;
        let newH = resizeStartDim.current.h;

        if (isResizing.includes('w')) { newX += dx; newW -= dx; }
        if (isResizing.includes('e')) { newW += dx; }
        if (isResizing.includes('n')) { newY += dy; newH -= dy; }
        if (isResizing.includes('s')) { newH += dy; }

        const minSizePixels = 10; // Minimum size in pixels
        newW = Math.max(newW, minSizePixels);
        newH = Math.max(newH, minSizePixels);
        
        // Prevent negative size or flipping by adjusting position
        if (newW < minSizePixels) {
            if (isResizing.includes('w')) newX = resizeStartDim.current.x + resizeStartDim.current.w - minSizePixels;
            newW = minSizePixels;
        }
        if (newH < minSizePixels) {
            if (isResizing.includes('n')) newY = resizeStartDim.current.y + resizeStartDim.current.h - minSizePixels;
            newH = minSizePixels;
        }

        const newXPercent = Math.max(0, (newX / containerRect.width) * 100);
        const newYPercent = Math.max(0, (newY / containerRect.height) * 100);
        const newWPercent = Math.min(100 - newXPercent, (newW / containerRect.width) * 100);
        const newHPercent = Math.min(100 - newYPercent, (newH / containerRect.height) * 100);

        onUpdate(boxData.id, { 
            x: newXPercent, 
            y: newYPercent, 
            w: newWPercent, 
            h: newHPercent 
        });
    }
  }, [isDragging, isResizing, boxData.id, boxData.w, boxData.h, onUpdate, imageContainerRef]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(null);
    document.body.style.cursor = 'default';
  }, []);

  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const resizeHandles: ResizeDirection[] = ['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'];

  return (
    <div
      className={`absolute p-1 border-2 ${bg} ${selectedClass} transition-all duration-100 ease-in-out ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-grab'} flex items-center justify-center text-white text-xs font-medium shadow-lg hover:shadow-xl`}
      style={boxStyle}
      onMouseDown={handleMouseDownDrag}
      onClick={(e) => { e.stopPropagation(); onSelect(boxData.id); }} // Ensure selection on simple click too
    >
      <span className="truncate pointer-events-none">{boxData.label}</span>
      {isSelected && !disabled && (
        <>
          {resizeHandles.map(dir => (
            <div
              key={dir}
              className={`resize-handle ${dir}`}
              onMouseDown={(e) => handleMouseDownResize(e, dir)}
            />
          ))}
        </>
      )}
    </div>
  );
};

export default InteractiveBox;

    