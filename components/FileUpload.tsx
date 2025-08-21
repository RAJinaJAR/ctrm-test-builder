import React, { useState, useCallback } from 'react';
import { MAX_VIDEO_SIZE_BYTES, MAX_VIDEO_SIZE_MB } from '../constants';
import { UploadIcon } from './icons';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onImportSelect: (file: File) => void;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, onImportSelect, disabled }) => {
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importFileName, setImportFileName] = useState<string | null>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setFileName(null);
    setImportFileName(null);
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'video/mp4') {
        setError('Invalid file type. Please upload an MP4 video.');
        event.target.value = ''; // Reset file input
        return;
      }
      if (file.size > MAX_VIDEO_SIZE_BYTES) {
        setError(`File is too large. Maximum size is ${MAX_VIDEO_SIZE_MB}MB.`);
        event.target.value = ''; // Reset file input
        return;
      }
      setFileName(file.name);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleImportFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setFileName(null);
    setImportFileName(null);
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.zip')) {
        setError('Invalid file type. Please upload a .zip test package.');
        event.target.value = ''; // Reset file input
        return;
      }
      setImportFileName(file.name);
      onImportSelect(file);
    }
  }, [onImportSelect]);

  return (
    <div className="w-full max-w-2xl p-6 bg-white rounded-lg shadow-md divide-y divide-gray-200">
      <div className="pb-6">
        <h2 className="text-center text-xl font-semibold text-gray-700 mb-4">Create New Test from Video</h2>
        <label 
          htmlFor="video-upload" 
          className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                      ${disabled ? 'bg-gray-200 border-gray-300 cursor-not-allowed' : 'bg-gray-50 hover:bg-gray-100 border-gray-300 hover:border-gray-400'}`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadIcon className={`w-10 h-10 mb-3 ${disabled ? 'text-gray-400' : 'text-gray-500'}`} />
            <p className={`mb-2 text-sm ${disabled ? 'text-gray-500' : 'text-gray-600'}`}>
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className={`text-xs ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>MP4 video (MAX. {MAX_VIDEO_SIZE_MB}MB)</p>
          </div>
          <input 
            id="video-upload" 
            type="file" 
            className="hidden" 
            accept="video/mp4" 
            onChange={handleFileChange} 
            disabled={disabled}
          />
        </label>
        {fileName && <p className="mt-2 text-sm text-green-600">Selected Video: {fileName}</p>}
      </div>
      
      <div className="pt-6">
        <h2 className="text-center text-xl font-semibold text-gray-700 mb-4">Load Existing Test</h2>
        <label 
          htmlFor="test-upload" 
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                      ${disabled ? 'bg-gray-200 border-gray-300 cursor-not-allowed' : 'bg-gray-50 hover:bg-gray-100 border-gray-300 hover:border-gray-400'}`}
        >
          <div className="flex flex-col items-center justify-center">
            <UploadIcon className={`w-8 h-8 mb-2 ${disabled ? 'text-gray-400' : 'text-gray-500'}`} />
            <p className={`text-sm ${disabled ? 'text-gray-500' : 'text-gray-600'}`}>
              <span className="font-semibold">Upload Test Package</span>
            </p>
            <p className={`text-xs ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>.zip file</p>
          </div>
          <input 
            id="test-upload" 
            type="file" 
            className="hidden" 
            accept=".zip,application/zip,application/x-zip-compressed" 
            onChange={handleImportFileChange} 
            disabled={disabled}
          />
        </label>
        {importFileName && <p className="mt-2 text-sm text-green-600">Selected Package: {importFileName}</p>}
      </div>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default FileUpload;