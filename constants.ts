
import { BoxType } from './types';

export const MAX_VIDEO_SIZE_MB = 200;
export const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;
export const NUM_FRAMES_TO_EXTRACT = 10; // Number of frames to extract
export const FRAME_EXTRACTION_TARGET_FPS = 1; // Try to extract 1 frame per N seconds of video duration, up to NUM_FRAMES_TO_EXTRACT

export const BOX_COLORS: Record<BoxType, { bg: string; border: string }> = {
  [BoxType.HOTSPOT]: { bg: 'bg-transparent', border: 'border-none' }, // Tailwind opacity format
  [BoxType.INPUT]: { bg: 'bg-blue-500/70', border: 'border-blue-700' },
};

export const SELECTED_BOX_BORDER_COLOR = 'border-yellow-400 ring-2 ring-yellow-400';

export const DEFAULT_BOX_SIZE_PERCENT = { w: 15, h: 5 }; // Default new box size as % of image
export const DEFAULT_BOX_POSITION_PERCENT = { x: 42.5, y: 45 }; // Default new box position as % of image

    