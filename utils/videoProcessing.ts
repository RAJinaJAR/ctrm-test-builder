import { FrameAssetData } from '../types';
import { FRAME_EXTRACTION_INTERVAL_SECONDS } from '../constants';

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
      
      const timestamps: number[] = [];
      if (duration > 0) {
        for (let time = 0; time < duration; time += FRAME_EXTRACTION_INTERVAL_SECONDS) {
          timestamps.push(time);
        }
        // For videos shorter than the interval, still grab the first frame.
        if (timestamps.length === 0) {
          timestamps.push(0);
        }
      }

      const numFramesToGrab = timestamps.length;

      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }
      
      if (numFramesToGrab === 0) {
        onProgress(100);
        URL.revokeObjectURL(video.src);
        resolve(frames);
        return;
      }

      for (let i = 0; i < numFramesToGrab; i++) {
        video.currentTime = timestamps[i];
        await new Promise<void>(r => video.onseeked = () => r());
        
        ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9); // 0.9 quality
        frames.push({
          id: crypto.randomUUID(),
          imageDataUrl,
          originalWidth: video.videoWidth,
          originalHeight: video.videoHeight,
          boxes: [],
          includeInTest: false, // Initialize as false
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
