import React, { useState, useCallback, useEffect, useRef } from 'react';
import FileUpload from './components/FileUpload';
import FrameNavigator from './components/FrameNavigator';
import FrameDisplay from './components/FrameDisplay';
import ControlsPanel from './components/ControlsPanel';
import TestPlayer from './components/TestPlayer';
import ShareModal from './components/ShareModal';
import { FrameAssetData, InteractiveBoxData, BoxType, InputBox, Hotspot } from './types';
import { extractFramesFromVideo } from './utils/videoProcessing';
import { createTestPackage, loadTestPackage, createTestPackageBlob } from './utils/zipUtils';
import { DEFAULT_BOX_SIZE_PERCENT } from './constants';
import { LoadingSpinnerIcon } from './components/icons';

// Add type declarations for Google APIs loaded from scripts
// FIX: Correctly augment the Window interface to inform TypeScript about gapi and google properties.
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const App: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [frames, setFrames] = useState<FrameAssetData[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isTestModeActive, setIsTestModeActive] = useState(false);
  const [testPlayerFrames, setTestPlayerFrames] = useState<FrameAssetData[]>([]);

  // State for Google Drive Publishing
  const [isPublishing, setIsPublishing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [googleClientsReady, setGoogleClientsReady] = useState(false);
  const tokenClientRef = useRef<any>(null);

  // Effect to initialize Google clients
  useEffect(() => {
    const checkAndInitClients = () => {
      if (window.gapi && window.google) {
        // gapi: For API calls (Drive)
        window.gapi.load('client', async () => {
          try {
            await window.gapi.client.init({
              apiKey: 'AIzaSyCjOpMgz2QcXniNBOOl7WM0Ur8nFTUpB7M',
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            });
            // gis: For OAuth2
            tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
              client_id: '6776752288-9jcd15h51os7fd8qoh8qi7djoqifn89a.apps.googleusercontent.com',
              scope: 'https://www.googleapis.com/auth/drive.file',
              callback: '', // We'll handle the token in a promise
            });
            setGoogleClientsReady(true);
          } catch (err) {
              console.error("Error initializing Google clients:", err);
              setPublishError("Could not initialize Google services. Please check your API key and Client ID configuration.");
              setGoogleClientsReady(false);
          }
        });
      } else {
        setTimeout(checkAndInitClients, 100); // Poll until scripts are loaded
      }
    };
    checkAndInitClients();
  }, []);

  const getAuthToken = useCallback((): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!tokenClientRef.current) {
        return reject(new Error('Google Auth client not ready. Refresh the page.'));
      }
      tokenClientRef.current.callback = (resp: any) => {
        if (resp.error) {
          return reject(new Error(`Google Auth error: ${resp.error}. User may have denied permission.`));
        }
        resolve(resp);
      };
      // A valid token is available for 1 hour after it's granted
      const token = window.gapi.client.getToken();
      if (token && token.expires_in > 0) {
        return resolve(token);
      }
      // No token or expired, so request one. This will trigger the popup.
      tokenClientRef.current.requestAccessToken({prompt: ''});
    });
  }, []);

  const uploadToDrive = useCallback(async (blob: Blob): Promise<string> => {
    const FOLDER_ID = '1Oa3bJ0BswoVmdc7EhQkzUt1zuNb2wEiP'; // Hardcoded folder ID provided by user
    const FILENAME = `test_package_${Date.now()}.zip`;

    // 1. Upload the file directly to the specified folder
    const fileMetadata = { name: FILENAME, parents: [FOLDER_ID] };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
    form.append('file', blob);

    const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({ 'Authorization': 'Bearer ' + window.gapi.client.getToken().access_token }),
        body: form,
    });
    const fileResult = await uploadResponse.json();
    
    if (fileResult.error) {
        console.error('Google Drive Upload Error:', fileResult.error);
        throw new Error(`Upload Failed: ${fileResult.error.message}. You may not have permission to upload to the target folder.`);
    }

    const fileId = fileResult.id;

    // 2. Make the file public (anyone with the link can view)
    await window.gapi.client.drive.permissions.create({
        fileId: fileId,
        resource: { role: 'reader', type: 'anyone' },
    });
    
    // 3. Get the public web link
    const linkResponse = await window.gapi.client.drive.files.get({
        fileId: fileId,
        fields: 'webViewLink',
    });
    return linkResponse.result.webViewLink;
  }, []);


  const handlePublish = async () => {
    const framesToPublish = frames.filter(f => f.includeInTest);
    if (framesToPublish.length === 0) {
        setError("Cannot publish: No frames are selected for inclusion.");
        setTimeout(() => setError(null), 3000);
        return;
    }
    
    setShowShareModal(true);
    setIsPublishing(true);
    setShareLink(null);
    setPublishError(null);

    try {
        await getAuthToken();
        const blob = await createTestPackageBlob(framesToPublish);
        const googleDriveLink = await uploadToDrive(blob);
        const testPlayerUrl = `https://interactive-test-player.onrender.com/?testUrl=${encodeURIComponent(googleDriveLink)}`;
        setShareLink(testPlayerUrl);
    } catch (err: any) {
        console.error("Publishing error:", err);
        setPublishError(err.message || "An unknown error occurred during publishing.");
    } finally {
        setIsPublishing(false);
    }
  };


  const handleFileSelect = useCallback(async (file: File) => {
    setVideoFile(file);
    setIsLoading(true);
    setError(null);
    setFrames([]);
    setCurrentFrameIndex(0);
    setSelectedBoxId(null);
    setLoadingProgress(0);
    setIsTestModeActive(false); 
    setTestPlayerFrames([]);
    try {
      const extracted = await extractFramesFromVideo(file, (progress) => {
        setLoadingProgress(progress);
      });
      setFrames(extracted);
      if (extracted.length === 0) {
        setError("No frames could be extracted from the video.");
      }
    } catch (err) {
      console.error("Error extracting frames:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleImportTest = useCallback(async (file: File) => {
    setVideoFile(file); // Use the zip file to signify a project is "loaded"
    setIsLoading(true);
    setError(null);
    setFrames([]);
    setCurrentFrameIndex(0);
    setSelectedBoxId(null);
    setLoadingProgress(0); // No progress for import, just spinner
    setIsTestModeActive(false); 
    setTestPlayerFrames([]);

    try {
        const importedFrames = await loadTestPackage(file);
        setFrames(importedFrames);
        if (importedFrames.length === 0) {
            setError("The test package appears to be empty or invalid.");
        }
    } catch (err) {
        console.error("Error importing test package:", err);
        setError(err instanceof Error ? err.message : String(err));
        setVideoFile(null); // Clear file on error to go back to start screen
    } finally {
        setIsLoading(false);
    }
  }, []);

  const handleExportTest = async () => {
    const framesToExport = frames.filter(f => f.includeInTest);
    if (framesToExport.length === 0) {
        setError("Cannot export: No frames are selected for inclusion.");
        setTimeout(() => setError(null), 3000);
        return;
    }

    setIsExporting(true);
    setError(null);
    try {
        await createTestPackage(framesToExport);
    } catch (err) {
        console.error("Error creating test package:", err);
        setError(err instanceof Error ? err.message : String(err));
    } finally {
        setIsExporting(false);
    }
  };


  const handleAddHotspot = useCallback((pos: {x: number, y: number}) => {
    if (frames.length === 0) return;
    const currentFrame = frames[currentFrameIndex];
    if (!currentFrame || !currentFrame.includeInTest) return;

    const { w, h } = DEFAULT_BOX_SIZE_PERCENT;
    // Center the new hotspot on the click coordinates
    const x = pos.x - w / 2;
    const y = pos.y - h / 2;

    const newBox: Hotspot = {
      id: crypto.randomUUID(),
      type: BoxType.HOTSPOT,
      x: Math.max(0, Math.min(x, 100 - w)),
      y: Math.max(0, Math.min(y, 100 - h)),
      w,
      h,
      label: 'New Hotspot',
    };

    const updatedFrames = frames.map((frame, index) =>
      index === currentFrameIndex
        ? { ...frame, boxes: [...frame.boxes, newBox] }
        : frame
    );
    setFrames(updatedFrames);
    setSelectedBoxId(newBox.id);
  }, [frames, currentFrameIndex]);

  const handleAddInputField = useCallback((box: {x: number, y: number, w: number, h: number}) => {
    if (frames.length === 0) return;
    const currentFrame = frames[currentFrameIndex];
    if (!currentFrame || !currentFrame.includeInTest) return;

    const newBox: InputBox = {
      id: crypto.randomUUID(),
      type: BoxType.INPUT,
      ...box,
      label: 'New Input',
      expected: '',
    };

    const updatedFrames = frames.map((frame, index) =>
      index === currentFrameIndex
        ? { ...frame, boxes: [...frame.boxes, newBox] }
        : frame
    );
    setFrames(updatedFrames);
    setSelectedBoxId(newBox.id);
  }, [frames, currentFrameIndex]);

  const handleUpdateBox = useCallback((id: string, updates: Partial<InteractiveBoxData>) => {
    setFrames((prevFrames) =>
      prevFrames.map((frame, index) => {
        if (index !== currentFrameIndex) return frame;
        return {
          ...frame,
          boxes: frame.boxes.map((box): InteractiveBoxData => {
            if (box.id === id) {
              const updatedBox = { ...box, ...updates };
              if (updatedBox.type === BoxType.HOTSPOT) {
                return updatedBox as Hotspot;
              } else if (updatedBox.type === BoxType.INPUT) {
                return updatedBox as InputBox;
              }
            }
            return box;
          }),
        };
      })
    );
  }, [currentFrameIndex]);

  const handleDeleteBox = useCallback((id: string) => {
    setFrames((prevFrames) =>
      prevFrames.map((frame, index) => {
        if (index !== currentFrameIndex) return frame;
        return {
          ...frame,
          boxes: frame.boxes.filter((box) => box.id !== id),
        };
      })
    );
    if (selectedBoxId === id) {
      setSelectedBoxId(null);
    }
  }, [currentFrameIndex, selectedBoxId]);
  
  const handleImageClick = useCallback(() => {
    setSelectedBoxId(null);
  }, []);

  const handleToggleFrameInclusion = useCallback((included: boolean) => {
    setFrames(prevFrames => 
      prevFrames.map((frame, index) => 
        index === currentFrameIndex ? { ...frame, includeInTest: included } : frame
      )
    );
    // If current frame is excluded, deselect any selected box
    if (!included && frames[currentFrameIndex]?.id === currentFrameData?.id) {
        setSelectedBoxId(null);
    }
  }, [currentFrameIndex, frames]);

  const handleDuplicateFrame = useCallback(() => {
    const frameToDuplicate = frames[currentFrameIndex];
    if (!frameToDuplicate) return;

    // Deep copy of the frame with new IDs
    const newFrame: FrameAssetData = {
      ...frameToDuplicate,
      id: crypto.randomUUID(),
      boxes: frameToDuplicate.boxes.map(box => ({
        ...box,
        id: crypto.randomUUID(),
      })),
    };

    // Insert the new frame after the current one
    const newFrames = [
      ...frames.slice(0, currentFrameIndex + 1),
      newFrame,
      ...frames.slice(currentFrameIndex + 1),
    ];

    setFrames(newFrames);
    // Navigate to the new frame
    setCurrentFrameIndex(currentFrameIndex + 1);
  }, [frames, currentFrameIndex]);

  const handleStartTest = () => {
    const framesToInclude = frames.filter(frame => frame.includeInTest);
    if (framesToInclude.length === 0) {
      setError("Cannot start test: No frames are selected for inclusion.");
      setTimeout(() => setError(null), 3000);
      return;
    }
    setTestPlayerFrames(framesToInclude);
    setIsTestModeActive(true);
    setSelectedBoxId(null); 
  };

  const handleExitTest = () => {
    setIsTestModeActive(false);
    setTestPlayerFrames([]);
  };

  const currentFrameData = frames[currentFrameIndex] || null;
  const selectedBoxData = currentFrameData?.boxes.find(b => b.id === selectedBoxId) || null;

  useEffect(() => {
    if (!videoFile) {
      setFrames([]);
      setCurrentFrameIndex(0);
      setSelectedBoxId(null);
      setError(null);
      setIsLoading(false);
      setIsTestModeActive(false);
      setTestPlayerFrames([]);
    }
  }, [videoFile]);
  
  useEffect(() => {
    if (selectedBoxId && currentFrameData) {
        const boxExistsInCurrentFrame = currentFrameData.boxes.some(b => b.id === selectedBoxId);
        if (!boxExistsInCurrentFrame || !currentFrameData.includeInTest) {
            setSelectedBoxId(null);
        }
    } else if (selectedBoxId && !currentFrameData) { 
        setSelectedBoxId(null);
    }
  }, [currentFrameIndex, frames, selectedBoxId, currentFrameData]);

  if (isTestModeActive && testPlayerFrames.length > 0) {
    return (
      <TestPlayer
        frames={testPlayerFrames}
        onExitTest={handleExitTest}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col items-center p-4 md:p-8" aria-live="polite">
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        isPublishing={isPublishing}
        shareLink={shareLink}
        error={publishError}
      />
      <header className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-700">CTRM Hotspot-&amp;-Input Test Builder</h1>
      </header>

      {!videoFile && !isLoading && (
        <FileUpload onFileSelect={handleFileSelect} onImportSelect={handleImportTest} disabled={isLoading} />
      )}
      
      {isLoading && (
        <div role="status" aria-label="Loading content" className="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow-md">
          <LoadingSpinnerIcon className="w-12 h-12 text-blue-600 mb-4" />
          <p className="text-lg text-slate-600">
            {videoFile?.name.endsWith('.zip') ? 'Loading test package...' : `Processing video... ${loadingProgress}%`}
          </p>
          {!videoFile?.name.endsWith('.zip') && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${loadingProgress}%` }} aria-valuenow={loadingProgress} aria-valuemin={0} aria-valuemax={100}></div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div role="alert" className="my-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded-md shadow">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {frames.length > 0 && !isLoading && (
        <div className="w-full max-w-7xl flex flex-col md:flex-row gap-6">
          <main className="flex-grow md:w-2/3 lg:w-3/4 space-y-4">
            <FrameNavigator
              currentFrameIndex={currentFrameIndex}
              totalFrames={frames.length}
              isCurrentFrameIncluded={currentFrameData?.includeInTest ?? false}
              onToggleFrameInclusion={handleToggleFrameInclusion}
              onPrev={() => {
                setSelectedBoxId(null); 
                setCurrentFrameIndex(Math.max(0, currentFrameIndex - 1));
              }}
              onNext={() => {
                setSelectedBoxId(null);
                setCurrentFrameIndex(Math.min(frames.length - 1, currentFrameIndex + 1));
              }}
              disabled={isLoading}
            />
            <FrameDisplay
              frame={currentFrameData}
              selectedBoxId={selectedBoxId}
              onSelectBox={setSelectedBoxId}
              onUpdateBox={handleUpdateBox}
              onImageClick={handleImageClick}
              onAddHotspot={handleAddHotspot}
              onAddInputField={handleAddInputField}
              disabled={isLoading}
            />
          </main>
          <aside className="w-full md:w-1/3 lg:w-1/4">
            <ControlsPanel
              selectedBox={selectedBoxData}
              onUpdateBox={handleUpdateBox}
              onDeleteBox={handleDeleteBox}
              disabled={isLoading || !currentFrameData?.includeInTest}
            />
            <div className="mt-6 space-y-3">
               <button
                onClick={handleStartTest}
                disabled={isLoading || frames.filter(f => f.includeInTest).length === 0}
                className="w-full px-6 py-3 text-base font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors"
                aria-label={`Start test with ${frames.filter(f => f.includeInTest).length} selected frames`}
              >
                Start Test ({frames.filter(f => f.includeInTest).length} Frame{frames.filter(f => f.includeInTest).length === 1 ? '' : 's'})
              </button>
              <button
                onClick={handleExportTest}
                disabled={isLoading || isExporting || frames.filter(f => f.includeInTest).length === 0}
                className="w-full px-6 py-3 flex items-center justify-center text-base font-medium text-indigo-700 bg-indigo-100 rounded-md shadow-sm hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-50 disabled:text-indigo-300 disabled:cursor-not-allowed transition-colors"
                aria-label="Export test data as a zip package"
              >
                {isExporting ? <LoadingSpinnerIcon className="w-5 h-5 mr-2 text-indigo-700"/> : null}
                {isExporting ? 'Exporting...' : 'Export Test Package (.zip)'}
              </button>
              <button
                onClick={handlePublish}
                disabled={isLoading || isPublishing || !googleClientsReady || frames.filter(f => f.includeInTest).length === 0}
                className="w-full px-6 py-3 flex items-center justify-center text-base font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                aria-label="Publish test package to Google Drive"
              >
                {isPublishing ? <LoadingSpinnerIcon className="w-5 h-5 mr-2 text-white"/> : null}
                {isPublishing ? 'Publishing...' : 'Publish Test'}
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default App;
