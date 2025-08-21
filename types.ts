
export enum BoxType {
  HOTSPOT = 'hotspot',
  INPUT = 'input',
}

export interface BoxCommon {
  id: string;
  x: number; // percentage of image width
  y: number; // percentage of image height
  w: number; // percentage of image width
  h: number; // percentage of image height
  label: string;
}

export interface Hotspot extends BoxCommon {
  type: BoxType.HOTSPOT;
}

export interface InputBox extends BoxCommon {
  type: BoxType.INPUT;
  expected: string;
}

export type InteractiveBoxData = Hotspot | InputBox;

export interface FrameAssetData {
  id: string;
  imageDataUrl: string;
  originalWidth: number;
  originalHeight: number;
  boxes: InteractiveBoxData[];
  includeInTest: boolean; // New field
}

// For JSON output according to spec
export interface JsonHotspot {
  x: number; // pixel value
  y: number; // pixel value
  w: number; // pixel value
  h: number; // pixel value
  label: string;
}

export interface JsonInput {
  x: number; // pixel value
  y: number; // pixel value
  w: number; // pixel value
  h: number; // pixel value
  label: string;
  expected: string;
}

export interface JsonFrame {
  image: string; // e.g., frame_001.jpg
  hotspots: JsonHotspot[];
  inputs: JsonInput[];
}