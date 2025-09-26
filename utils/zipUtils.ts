
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { FrameAssetData, JsonFrame, JsonInput, JsonHotspot, InteractiveBoxData, BoxType, Hotspot, InputBox } from '../types';
import { convertFrameDataToJsonFormat } from './boxUtils';

/**
 * Creates a ZIP package containing test.json and image frames.
 */
export const createTestPackage = async (frames: FrameAssetData[]): Promise<void> => {
  const zip = new JSZip();
  
  const includedFrames = frames.filter(f => f.includeInTest);
  const jsonData = convertFrameDataToJsonFormat(includedFrames);
  
  zip.file('test.json', JSON.stringify(jsonData, null, 2));

  const imagePromises = includedFrames.map(async (frame, index) => {
    // The JSON format uses 1-based padded index, so we match it here.
    const frameNumber = String(index + 1).padStart(3, '0');
    const imageName = `frame_${frameNumber}.jpg`;

    // Convert data URL to blob
    const res = await fetch(frame.imageDataUrl);
    const blob = await res.blob();
    
    zip.file(imageName, blob);
  });

  await Promise.all(imagePromises);

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, 'test_package.zip');
};

/**
 * Creates a ZIP package blob in memory, without triggering a download.
 */
export const createTestPackageBlob = async (frames: FrameAssetData[]): Promise<Blob> => {
  const zip = new JSZip();
  
  const includedFrames = frames.filter(f => f.includeInTest);
  const jsonData = convertFrameDataToJsonFormat(includedFrames);
  
  zip.file('test.json', JSON.stringify(jsonData, null, 2));

  const imagePromises = includedFrames.map(async (frame, index) => {
    // The JSON format uses 1-based padded index, so we match it here.
    const frameNumber = String(index + 1).padStart(3, '0');
    const imageName = `frame_${frameNumber}.jpg`;

    // Convert data URL to blob
    const res = await fetch(frame.imageDataUrl);
    const blob = await res.blob();
    
    zip.file(imageName, blob);
  });

  await Promise.all(imagePromises);

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return zipBlob;
};

const getImageDimensions = (dataUrl: string): Promise<{width: number; height: number}> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = (err) => {
      reject(new Error('Could not load image to get dimensions'));
    };
    img.src = dataUrl;
  });
};

/**
 * Loads a test package from a ZIP file and reconstructs the frame data.
 */
export const loadTestPackage = async (zipFile: File): Promise<FrameAssetData[]> => {
  const zip = await JSZip.loadAsync(zipFile);
  
  const jsonFile = zip.file('test.json');
  if (!jsonFile) {
    throw new Error('Invalid test package: "test.json" not found.');
  }
  
  const jsonContent = await jsonFile.async('string');
  const jsonFrames: JsonFrame[] = JSON.parse(jsonContent);

  const frameDataPromises = jsonFrames.map(async (jsonFrame): Promise<FrameAssetData> => {
    const imageFile = zip.file(jsonFrame.image);
    if (!imageFile) {
      throw new Error(`Image "${jsonFrame.image}" specified in test.json not found in the package.`);
    }

    const imageBase64 = await imageFile.async('base64');
    const imageDataUrl = `data:image/jpeg;base64,${imageBase64}`;
    
    const { width: originalWidth, height: originalHeight } = await getImageDimensions(imageDataUrl);

    const boxes: InteractiveBoxData[] = [];

    jsonFrame.hotspots.forEach((hotspot: JsonHotspot) => {
      boxes.push({
        id: crypto.randomUUID(),
        type: BoxType.HOTSPOT,
        x: (hotspot.x / originalWidth) * 100,
        y: (hotspot.y / originalHeight) * 100,
        w: (hotspot.w / originalWidth) * 100,
        h: (hotspot.h / originalHeight) * 100,
        label: hotspot.label,
        order: hotspot.order ?? 1, // Backwards compatibility
      } as Hotspot);
    });

    jsonFrame.inputs.forEach((input: JsonInput) => {
      boxes.push({
        id: crypto.randomUUID(),
        type: BoxType.INPUT,
        x: (input.x / originalWidth) * 100,
        y: (input.y / originalHeight) * 100,
        w: (input.w / originalWidth) * 100,
        h: (input.h / originalHeight) * 100,
        label: input.label,
        expected: input.expected,
      } as InputBox);
    });

    return {
      id: crypto.randomUUID(),
      imageDataUrl,
      originalWidth,
      originalHeight,
      boxes,
      includeInTest: true, // All imported frames are part of the test
    };
  });

  return Promise.all(frameDataPromises);
};
