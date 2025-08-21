
import { FrameAssetData } from '../types';
import { NUM_FRAMES_TO_EXTRACT, FRAME_EXTRACTION_TARGET_FPS } from '../constants';

export const extractFramesFromVideo = async (
  videoFile: File,
  onProgress: (progress: number) => void
): Promise<FrameAssetData[]> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const frames: FrameAssetData[] = [];

    video.preload = 'metadata';
    video.src = URL.createObjectURL(videoFile);

    video.onloadedmetadata = async () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const duration = video.duration;
      
      let numFramesToGrab = NUM_FRAMES_TO_EXTRACT;
      // If video is short, extract fewer frames based on FPS target
      if (duration < NUM_FRAMES_TO_EXTRACT / FRAME_EXTRACTION_TARGET_FPS) {
        numFramesToGrab = Math.max(1, Math.floor(duration * FRAME_EXTRACTION_TARGET_FPS));
      }
      
      const interval = duration / numFramesToGrab;

      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      for (let i = 0; i < numFramesToGrab; i++) {
        video.currentTime = i * interval;
        await new Promise<void>(r => video.onseeked = () => r());
        
        ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9); // 0.9 quality
        frames.push({
          id: crypto.randomUUID(),
          imageDataUrl,
          originalWidth: video.videoWidth,
          originalHeight: video.videoHeight,
          boxes: [],
          includeInTest: true, // Initialize as true
        });
        onProgress(Math.round(((i + 1) / numFramesToGrab) * 100));
      }
      URL.revokeObjectURL(video.src); // Clean up
      resolve(frames);
    };

    video.onerror = (e) => {
      URL.revokeObjectURL(video.src);
      reject(new Error(`Error loading video: ${e_anyToString(e)}`));
    };
  });
};

// Helper to convert event or error to string
function e_anyToString(e: any): string {
  if (typeof e === 'string') return e;
  if (e instanceof Error) return e.message;
  if (e && e.target && e.target.error && e.target.error.message) return e.target.error.message;
  return 'Unknown video processing error';
}