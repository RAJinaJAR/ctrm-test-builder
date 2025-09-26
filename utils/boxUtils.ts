
import { InteractiveBoxData, FrameAssetData, JsonFrame, JsonHotspot, JsonInput, BoxType, Hotspot } from '../types';

export const convertFrameDataToJsonFormat = (frames: FrameAssetData[]): JsonFrame[] => {
  return frames.map((frame, index) => {
    const jsonHotspots: JsonHotspot[] = [];
    const jsonInputs: JsonInput[] = [];

    frame.boxes.forEach(box => {
      const commonPixelData = {
        x: Math.round((box.x / 100) * frame.originalWidth),
        y: Math.round((box.y / 100) * frame.originalHeight),
        w: Math.round((box.w / 100) * frame.originalWidth),
        h: Math.round((box.h / 100) * frame.originalHeight),
        label: box.label,
      };

      if (box.type === BoxType.HOTSPOT) {
        jsonHotspots.push({
          ...commonPixelData,
          order: (box as Hotspot).order,
        });
      } else if (box.type === BoxType.INPUT) {
        jsonInputs.push({
          ...commonPixelData,
          expected: box.expected,
        });
      }
    });
    
    // Pad index to 3 digits, e.g., 001, 002
    const frameNumber = String(index + 1).padStart(3, '0');

    return {
      image: `frame_${frameNumber}.jpg`, // Symbolic name
      hotspots: jsonHotspots,
      inputs: jsonInputs,
    };
  });
};
